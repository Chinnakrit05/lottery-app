import { ipcMain, dialog, app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import {
  listTicketsByRound,
  listRecentTickets,
  searchTickets,
  createTicket,
  createTicketsBulk,
  deleteTicket,
  type TicketInput,
  type BetType,
} from '../db/queries/tickets';
import { getRound } from '../db/queries/rounds';

const BET_LABEL: Record<BetType, string> = {
  '2_top': '2 ตัวบน',
  '2_bottom': '2 ตัวล่าง',
  '3_top': '3 ตัวบน',
  '3_tod': '3 ตัวโต๊ด',
};

export function registerTicketsHandlers() {
  ipcMain.handle('tickets:listByRound', (_e, roundId: number) => listTicketsByRound(roundId));
  ipcMain.handle('tickets:listRecent', (_e, roundId: number, limit?: number) =>
    listRecentTickets(roundId, limit ?? 10),
  );
  ipcMain.handle('tickets:search', (_e, roundId: number, betType: BetType | null, number: string | null) =>
    searchTickets(roundId, betType, number),
  );
  ipcMain.handle('tickets:create', (_e, data: TicketInput) => createTicket(data));
  ipcMain.handle('tickets:createBulk', (_e, rows: TicketInput[]) => createTicketsBulk(rows));
  ipcMain.handle('tickets:delete', (_e, id: number) => deleteTicket(id));

  ipcMain.handle('history:exportCsv', async (_e, roundId: number) => {
    const round = getRound(roundId);
    if (!round) return { ok: false, error: 'Round not found' };
    const rows = listTicketsByRound(roundId);
    const safeName = round.name.replace(/[^฀-๿a-zA-Z0-9_-]/g, '_');
    const defaultPath = path.join(app.getPath('downloads'), `lottery_${safeName}.csv`);

    const result = await dialog.showSaveDialog({
      title: 'Export CSV',
      defaultPath,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (result.canceled || !result.filePath) return { ok: false, canceled: true };

    const header = ['เวลา', 'ประเภท', 'เลข', 'ราคา', 'ลูกค้า', 'หมายเหตุ'];
    const lines = rows.map((r) => {
      const typeLabel = BET_LABEL[r.bet_type] + (r.is_reverse ? ' (กลับ)' : '');
      const buyer = r.customer_name || r.buyer_name || '';
      const note = (r.note || '').replace(/"/g, '""');
      return [
        r.created_at,
        typeLabel,
        r.number,
        r.price,
        `"${buyer.replace(/"/g, '""')}"`,
        `"${note}"`,
      ].join(',');
    });
    // UTF-8 BOM for Excel
    const content = '﻿' + header.join(',') + '\n' + lines.join('\n');
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return { ok: true, path: result.filePath, count: rows.length };
  });
}
