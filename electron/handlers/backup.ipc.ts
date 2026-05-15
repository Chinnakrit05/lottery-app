import { ipcMain, dialog, app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '../db/connection';
import { listRounds } from '../db/queries/rounds';
import { listCustomers } from '../db/queries/customers';

interface BackupFile {
  version: number;
  exported_at: string;
  rounds: any[];
  customers: any[];
  tickets: any[];
}

export function registerBackupHandlers() {
  ipcMain.handle('backup:stats', () => {
    const db = getDb();
    return {
      rounds: (db.prepare(`SELECT COUNT(*) as c FROM rounds`).get() as any).c,
      customers: (db.prepare(`SELECT COUNT(*) as c FROM customers`).get() as any).c,
      tickets: (db.prepare(`SELECT COUNT(*) as c FROM tickets`).get() as any).c,
    };
  });

  ipcMain.handle('backup:export', async () => {
    const db = getDb();
    const data: BackupFile = {
      version: 1,
      exported_at: new Date().toISOString(),
      rounds: listRounds(),
      customers: listCustomers(),
      tickets: db.prepare(`SELECT * FROM tickets`).all(),
    };

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const defaultPath = path.join(app.getPath('downloads'), `lottery-backup-${ts}.json`);
    const result = await dialog.showSaveDialog({
      title: 'Export Backup',
      defaultPath,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) return { ok: false, canceled: true };

    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { ok: true, path: result.filePath };
  });

  ipcMain.handle('backup:import', async (_e, mode: 'merge' | 'replace') => {
    const result = await dialog.showOpenDialog({
      title: 'Import Backup',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return { ok: false, canceled: true };

    const filePath = result.filePaths[0];
    let parsed: BackupFile;
    try {
      parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e: any) {
      return { ok: false, error: 'Invalid JSON: ' + e.message };
    }
    if (!parsed.rounds || !parsed.tickets) {
      return { ok: false, error: 'Backup file missing required fields' };
    }

    const db = getDb();
    const tx = db.transaction(() => {
      if (mode === 'replace') {
        db.exec(`DELETE FROM tickets; DELETE FROM customers; DELETE FROM rounds;`);
        // reset autoincrement
        db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('tickets','customers','rounds');`);
      }

      // Map old IDs to new IDs (handles both merge + replace)
      const roundIdMap = new Map<number, number>();
      const customerIdMap = new Map<number, number>();

      const insertRound = db.prepare(`
        INSERT INTO rounds (name, draw_date, status, rate_2_top, rate_2_bottom, rate_3_top, rate_3_tod,
                            deduct_percent, win_2_top, win_2_bottom, win_3_top, win_3_top2, created_at, updated_at)
        VALUES (@name, @draw_date, @status, @rate_2_top, @rate_2_bottom, @rate_3_top, @rate_3_tod,
                @deduct_percent, @win_2_top, @win_2_bottom, @win_3_top, @win_3_top2, @created_at, @updated_at)
      `);
      for (const r of parsed.rounds || []) {
        const info = insertRound.run({
          name: r.name,
          draw_date: r.draw_date ?? null,
          status: r.status ?? 'open',
          rate_2_top: r.rate_2_top ?? 70,
          rate_2_bottom: r.rate_2_bottom ?? 70,
          rate_3_top: r.rate_3_top ?? 500,
          rate_3_tod: r.rate_3_tod ?? 100,
          deduct_percent: r.deduct_percent ?? 30,
          win_2_top: r.win_2_top ?? null,
          win_2_bottom: r.win_2_bottom ?? null,
          win_3_top: r.win_3_top ?? null,
          win_3_top2: r.win_3_top2 ?? null,
          created_at: r.created_at ?? new Date().toISOString(),
          updated_at: r.updated_at ?? new Date().toISOString(),
        });
        roundIdMap.set(r.id, Number(info.lastInsertRowid));
      }

      const insertCustomer = db.prepare(`
        INSERT INTO customers (name, phone, note, created_at, updated_at)
        VALUES (@name, @phone, @note, @created_at, @updated_at)
      `);
      for (const c of parsed.customers || []) {
        const info = insertCustomer.run({
          name: c.name,
          phone: c.phone ?? null,
          note: c.note ?? null,
          created_at: c.created_at ?? new Date().toISOString(),
          updated_at: c.updated_at ?? new Date().toISOString(),
        });
        customerIdMap.set(c.id, Number(info.lastInsertRowid));
      }

      const insertTicket = db.prepare(`
        INSERT INTO tickets (round_id, customer_id, number, bet_type, price, buyer_name, note, is_reverse, created_at)
        VALUES (@round_id, @customer_id, @number, @bet_type, @price, @buyer_name, @note, @is_reverse, @created_at)
      `);
      for (const t of parsed.tickets || []) {
        const newRoundId = roundIdMap.get(t.round_id);
        if (!newRoundId) continue; // skip orphans
        const newCustomerId = t.customer_id ? customerIdMap.get(t.customer_id) ?? null : null;
        insertTicket.run({
          round_id: newRoundId,
          customer_id: newCustomerId,
          number: t.number,
          bet_type: t.bet_type,
          price: t.price,
          buyer_name: t.buyer_name ?? null,
          note: t.note ?? null,
          is_reverse: t.is_reverse ? 1 : 0,
          created_at: t.created_at ?? new Date().toISOString(),
        });
      }
    });

    try {
      tx();
    } catch (e: any) {
      return { ok: false, error: 'Import failed: ' + e.message };
    }
    return { ok: true };
  });
}
