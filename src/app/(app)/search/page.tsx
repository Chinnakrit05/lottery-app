'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NoRound } from '@/components/no-round';
import { TicketBadge } from '@/components/ticket-badge';
import { TicketNumber } from '@/components/ticket-number';
import { useCurrentRoundCtx } from '@/contexts/current-round';
import { dbClient } from '@/lib/db-client';
import type { BetType, TicketWithCustomer } from '@/types/database';
import { BET_LABELS, BET_TYPES } from '@/lib/constants';
import { formatBaht, formatDateTime } from '@/lib/format';

export default function SearchPage() {
  const { currentRound } = useCurrentRoundCtx();
  const [betType, setBetType] = useState<BetType | 'all'>('all');
  const [number, setNumber] = useState('');
  const [results, setResults] = useState<TicketWithCustomer[]>([]);
  const [searched, setSearched] = useState(false);

  if (!currentRound) return <NoRound />;

  const doSearch = async () => {
    try {
      const rows = await dbClient.tickets.search(
        currentRound.id,
        betType === 'all' ? null : betType,
        number.trim() || null,
      );
      setResults(rows);
      setSearched(true);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const totalAmount = results.reduce((s, r) => s + r.price, 0);
  const byType = BET_TYPES.map((t) => {
    const rows = results.filter((r) => r.bet_type === t);
    return { type: t, count: rows.length, amount: rows.reduce((s, r) => s + r.price, 0) };
  });

  return (
    <div className="space-y-4 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>🔍 ค้นหาเลข</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>ประเภท</Label>
              <Select value={betType} onValueChange={(v) => setBetType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  {BET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{BET_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>เลข (เว้นว่าง = ทั้งหมด)</Label>
              <Input
                value={number}
                inputMode="numeric"
                onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={doSearch} className="w-full">ค้นหา</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="จำนวนรายการ" value={results.length.toString()} />
            <StatCard label="ยอดรวม" value={formatBaht(totalAmount)} />
            {byType.slice(0, 2).map((t) => (
              <StatCard key={t.type} label={BET_LABELS[t.type]} value={`${t.count} · ${formatBaht(t.amount)}`} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>รายการที่ตรง ({results.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">ไม่พบรายการ</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เวลา</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>เลข</TableHead>
                      <TableHead className="text-right">ราคา</TableHead>
                      <TableHead>ลูกค้า</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</TableCell>
                        <TableCell><TicketBadge betType={r.bet_type} /></TableCell>
                        <TableCell><TicketNumber number={r.number} isReverse={r.is_reverse} /></TableCell>
                        <TableCell className="text-right">{formatBaht(r.price)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.customer_name || r.buyer_name || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-lg font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
