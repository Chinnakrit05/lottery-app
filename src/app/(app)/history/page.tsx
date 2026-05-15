'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NoRound } from '@/components/no-round';
import { useCurrentRoundCtx } from '@/contexts/current-round';
import { dbClient } from '@/lib/db-client';
import type { BetType, TicketWithCustomer } from '@/types/database';
import { BET_LABELS, BET_TYPES } from '@/lib/constants';
import { formatBaht, formatDateTime } from '@/lib/format';
import { TicketBadge } from '@/components/ticket-badge';
import { TicketNumber } from '@/components/ticket-number';
import { Download, Search, Trash2, Printer } from 'lucide-react';
import { PrintReceipt } from '@/components/print-receipt';

export default function HistoryPage() {
  const { currentRound } = useCurrentRoundCtx();
  const [tickets, setTickets] = useState<TicketWithCustomer[]>([]);
  const [filter, setFilter] = useState<BetType | 'all'>('all');
  const [query, setQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!currentRound) return;
    const rows = await dbClient.tickets.listByRound(currentRound.id);
    setTickets(rows);
  }, [currentRound]);

  useEffect(() => { load(); }, [load]);

  if (!currentRound) return <NoRound />;

  const filtered = tickets.filter((t) => {
    if (filter !== 'all' && t.bet_type !== filter) return false;
    if (query) {
      const q = query.toLowerCase();
      const name = (t.customer_name || t.buyer_name || '').toLowerCase();
      if (!name.includes(q) && !t.number.includes(query)) return false;
    }
    return true;
  });

  const handleDelete = async (id: number) => {
    await dbClient.tickets.delete(id);
    toast.success('ลบรายการแล้ว');
    load();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await dbClient.history.exportCsv(currentRound.id);
      if (res.ok) toast.success(`Export ${res.count} รายการ → ${res.path}`);
      else if (!res.canceled) toast.error(res.error || 'Export ล้มเหลว');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden — only shows when window.print() is invoked */}
      <PrintReceipt
        round={currentRound}
        tickets={filtered}
        customerName={query.trim() ? query.trim() : null}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
            <span>📜 ประวัติ ({filtered.length} / {tickets.length})</span>
            <div className="flex gap-2">
              <Button
                onClick={() => window.print()}
                disabled={filtered.length === 0}
                variant="outline"
              >
                <Printer className="h-4 w-4 mr-2" />
                พิมพ์สลิป
              </Button>
              <Button onClick={handleExport} disabled={exporting || tickets.length === 0} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'กำลัง Export…' : 'Export CSV'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              ทั้งหมด
            </Button>
            {BET_TYPES.map((t) => (
              <Button
                key={t}
                variant={filter === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(t)}
              >
                {BET_LABELS[t]}
              </Button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อผู้ซื้อ หรือ เลข…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">ไม่มีรายการ</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เวลา</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>เลข</TableHead>
                  <TableHead className="text-right">ราคา</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(t.created_at)}</TableCell>
                    <TableCell><TicketBadge betType={t.bet_type} /></TableCell>
                    <TableCell><TicketNumber number={t.number} isReverse={t.is_reverse} /></TableCell>
                    <TableCell className="text-right">{formatBaht(t.price)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.customer_name || t.buyer_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
