import { ipcMain, dialog, app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '../db/connection';
import { listRounds } from '../db/queries/rounds';
import { listCustomers } from '../db/queries/customers';

const BACKUP_FORMAT_VERSION = 2;

interface BackupFile {
  format_version: number;          // backup schema version (for forward-compat)
  app_version?: string;            // app version that exported
  product_name?: string;           // "Love Number"
  exported_at: string;             // ISO timestamp
  // Legacy field name kept for v1 compat reads
  version?: number;
  rounds: any[];
  customers: any[];
  tickets: any[];
}

function detectFormat(raw: any): number {
  if (typeof raw.format_version === 'number') return raw.format_version;
  if (typeof raw.version === 'number') return raw.version;
  return 0;
}

export function registerBackupHandlers() {
  // -------- stats --------
  ipcMain.handle('backup:stats', () => {
    const db = getDb();
    return {
      rounds: (db.prepare(`SELECT COUNT(*) as c FROM rounds`).get() as any).c,
      customers: (db.prepare(`SELECT COUNT(*) as c FROM customers`).get() as any).c,
      tickets: (db.prepare(`SELECT COUNT(*) as c FROM tickets`).get() as any).c,
    };
  });

  // -------- export --------
  ipcMain.handle('backup:export', async () => {
    const db = getDb();
    const data: BackupFile = {
      format_version: BACKUP_FORMAT_VERSION,
      app_version: app.getVersion(),
      product_name: app.getName(),
      exported_at: new Date().toISOString(),
      rounds: listRounds(),
      customers: listCustomers(),
      tickets: db.prepare(`SELECT * FROM tickets`).all(),
    };

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const defaultPath = path.join(app.getPath('downloads'), `lovenumber-backup-${ts}.json`);
    const result = await dialog.showSaveDialog({
      title: 'Export Backup',
      defaultPath,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) return { ok: false, canceled: true };

    try {
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
      return {
        ok: true,
        path: result.filePath,
        stats: {
          rounds: data.rounds.length,
          customers: data.customers.length,
          tickets: data.tickets.length,
        },
      };
    } catch (e: any) {
      return { ok: false, error: 'เขียนไฟล์ไม่สำเร็จ: ' + e.message };
    }
  });

  // -------- preview (read file metadata before import) --------
  ipcMain.handle('backup:preview', async () => {
    const result = await dialog.showOpenDialog({
      title: 'เลือกไฟล์ Backup',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return { ok: false, canceled: true };

    const filePath = result.filePaths[0];
    let parsed: BackupFile;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      parsed = JSON.parse(raw);
    } catch (e: any) {
      return { ok: false, error: 'ไฟล์ JSON ไม่ถูกต้อง: ' + e.message };
    }
    if (!Array.isArray(parsed.rounds) || !Array.isArray(parsed.tickets)) {
      return { ok: false, error: 'ไฟล์ Backup ไม่ครบ — ไม่มี rounds หรือ tickets' };
    }
    const format = detectFormat(parsed);
    if (format > BACKUP_FORMAT_VERSION) {
      return { ok: false, error: `ไฟล์มาจาก format ใหม่กว่า (v${format}) — กรุณาอัพเดทแอป` };
    }
    const sizeBytes = fs.statSync(filePath).size;
    return {
      ok: true,
      filePath,
      meta: {
        format_version: format,
        app_version: parsed.app_version ?? null,
        product_name: parsed.product_name ?? null,
        exported_at: parsed.exported_at ?? null,
        size_bytes: sizeBytes,
        rounds: parsed.rounds.length,
        customers: Array.isArray(parsed.customers) ? parsed.customers.length : 0,
        tickets: parsed.tickets.length,
      },
    };
  });

  // -------- import --------
  ipcMain.handle('backup:import', async (_e, mode: 'merge' | 'replace', filePath?: string) => {
    let actualPath = filePath;
    if (!actualPath) {
      const result = await dialog.showOpenDialog({
        title: 'Import Backup',
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (result.canceled || result.filePaths.length === 0) return { ok: false, canceled: true };
      actualPath = result.filePaths[0];
    }

    let parsed: BackupFile;
    try {
      parsed = JSON.parse(fs.readFileSync(actualPath, 'utf-8'));
    } catch (e: any) {
      return { ok: false, error: 'ไฟล์ JSON ไม่ถูกต้อง: ' + e.message };
    }
    if (!Array.isArray(parsed.rounds) || !Array.isArray(parsed.tickets)) {
      return { ok: false, error: 'ไฟล์ Backup ไม่ครบ — ขาด rounds หรือ tickets' };
    }
    const format = detectFormat(parsed);
    if (format > BACKUP_FORMAT_VERSION) {
      return { ok: false, error: `ไฟล์มาจาก format ใหม่กว่าที่แอปรองรับ (v${format})` };
    }

    const db = getDb();

    // Safety: snapshot the current DB before destructive operations
    if (mode === 'replace') {
      try {
        const dbPath = (db as any).name as string;
        if (dbPath && fs.existsSync(dbPath)) {
          const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const safetyPath = dbPath + `.before-replace-${ts}.bak`;
          fs.copyFileSync(dbPath, safetyPath);
          console.log('[backup] Pre-replace safety snapshot:', safetyPath);
        }
      } catch (e) {
        console.warn('[backup] Could not create safety snapshot:', e);
      }
    }

    const stats = { rounds: 0, customers: 0, tickets: 0, skipped: 0 };

    const tx = db.transaction(() => {
      if (mode === 'replace') {
        db.exec(`DELETE FROM tickets; DELETE FROM customers; DELETE FROM rounds;`);
        db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('tickets','customers','rounds');`);
      }

      const roundIdMap = new Map<number, number>();
      const customerIdMap = new Map<number, number>();

      const insertRound = db.prepare(`
        INSERT INTO rounds (name, draw_date, status, rate_2_top, rate_2_bottom, rate_3_top, rate_3_tod,
                            deduct_percent, win_2_top, win_2_bottom, win_3_top, win_3_top2, created_at, updated_at)
        VALUES (@name, @draw_date, @status, @rate_2_top, @rate_2_bottom, @rate_3_top, @rate_3_tod,
                @deduct_percent, @win_2_top, @win_2_bottom, @win_3_top, @win_3_top2, @created_at, @updated_at)
      `);
      for (const r of parsed.rounds || []) {
        if (!r?.name) { stats.skipped++; continue; }
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
        stats.rounds++;
      }

      const insertCustomer = db.prepare(`
        INSERT INTO customers (name, phone, note, created_at, updated_at)
        VALUES (@name, @phone, @note, @created_at, @updated_at)
      `);
      for (const c of parsed.customers || []) {
        if (!c?.name) { stats.skipped++; continue; }
        const info = insertCustomer.run({
          name: c.name,
          phone: c.phone ?? null,
          note: c.note ?? null,
          created_at: c.created_at ?? new Date().toISOString(),
          updated_at: c.updated_at ?? new Date().toISOString(),
        });
        customerIdMap.set(c.id, Number(info.lastInsertRowid));
        stats.customers++;
      }

      const insertTicket = db.prepare(`
        INSERT INTO tickets (round_id, customer_id, number, bet_type, price, buyer_name, note, is_reverse, created_at)
        VALUES (@round_id, @customer_id, @number, @bet_type, @price, @buyer_name, @note, @is_reverse, @created_at)
      `);
      const VALID_BET_TYPES = new Set(['2_top', '2_bottom', '3_top', '3_tod']);
      for (const t of parsed.tickets || []) {
        const newRoundId = roundIdMap.get(t.round_id);
        if (!newRoundId) { stats.skipped++; continue; }
        if (!VALID_BET_TYPES.has(t.bet_type)) { stats.skipped++; continue; }
        const price = Number(t.price);
        if (!price || price <= 0) { stats.skipped++; continue; }
        const newCustomerId = t.customer_id ? customerIdMap.get(t.customer_id) ?? null : null;
        insertTicket.run({
          round_id: newRoundId,
          customer_id: newCustomerId,
          number: String(t.number ?? ''),
          bet_type: t.bet_type,
          price,
          buyer_name: t.buyer_name ?? null,
          note: t.note ?? null,
          is_reverse: t.is_reverse ? 1 : 0,
          created_at: t.created_at ?? new Date().toISOString(),
        });
        stats.tickets++;
      }
    });

    try {
      tx();
    } catch (e: any) {
      return { ok: false, error: 'Import ไม่สำเร็จ (rollback แล้ว): ' + e.message };
    }
    return { ok: true, stats };
  });
}
