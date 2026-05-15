'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NoRound } from '@/components/no-round';
import { useCurrentRoundCtx } from '@/contexts/current-round';
import { dbClient } from '@/lib/db-client';
import type { TicketWithCustomer } from '@/types/database';
import { calculatePrize, summarizeRound } from '@/lib/lottery';
import { formatBaht, formatDateTime, formatNumber } from '@/lib/format';
import { TicketBadge } from '@/components/ticket-badge';
import { TicketNumber } from '@/components/ticket-number';

export default function ResultPage() {
  const { currentRound, refresh } = useCurrentRoundCtx();
  const [tickets, setTickets] = useState<TicketWithCustomer[]>([]);
  const [win2Top, setWin2Top] = useState('');
  const [win2Bottom, setWin2Bottom] = useState('');
  const [win3Top, setWin3Top] = useState('');
  const [win3Top2, setWin3Top2] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentRound) return;
    setWin2Top(currentRound.win_2_top || '');
    setWin2Bottom(currentRound.win_2_bottom || '');
    setWin3Top(currentRound.win_3_top || '');
    setWin3Top2(currentRound.win_3_top2 || '');
    dbClient.tickets.listByRound(currentRound.id).then(setTickets);
  }, [currentRound]);

  if (!currentRound) return <NoRound />;

  const handleSave = async () => {
    setSaving(true);
    try {
      await dbClient.rounds.update(currentRound.id, {
        win_2_top: win2Top || null,
        win_2_bottom: win2Bottom || null,
        win_3_top: win3Top || null,
        win_3_top2: win3Top2 || null,
      });
      toast.success('บันทึกผลรางวัลแล้ว');
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const summary = summarizeRound(tickets, currentRound);
  const winners = tickets
    .map((t) => ({ ticket: t, prize: calculatePrize(t, currentRound) }))
    .filter((x) => x.prize > 0);

  return (
    <div className="space-y-4 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>🏆 ตรวจรางวัล — {currentRound.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>2 ตัวบน</Label>
              <Input maxLength={2} inputMode="numeric" value={win2Top} onChange={(e) => setWin2Top(e.target.value.replace(/[^0-9]/g, ''))} className="font-mono" />
            </div>
            <div>
              <Label>2 ตัวล่าง</Label>
              <Input maxLength={2} inputMode="numeric" value={win2Bottom} onChange={(e) => setWin2Bottom(e.target.value.replace(/[^0-9]/g, ''))} className="font-mono" />
            </div>
            <div>
              <Label>3 ตัวบน</Label>
              <Input maxLength={3} inputMode="numeric" value={win3Top} onChange={(e) => setWin3Top(e.target.value.replace(/[^0-9]/g, ''))} className="font-mono" />
            </div>
            <div>
              <Label>3 ตัวบน #2</Label>
              <Input maxLength={3} inputMode="numeric" value={win3Top2} onChange={(e) => setWin3Top2(e.target.value.replace(/[^0-9]/g, ''))} className="font-mono" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก…' : 'บันทึก + คำนวณ'}</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="ยอดขายรวม" value={formatBaht(summary.total_amount)} />
        <StatCard label={`หัก ${currentRound.deduct_percent}%`} value={formatBaht(summary.deduct_amount)} />
        <StatCard label="ยอดหลังหัก" value={formatBaht(summary.net_amount)} />
        <StatCard label="ต้องจ่าย" value={formatBaht(summary.prize_payout)} tone="negative" />
        <StatCard label="รายการที่ถูก" value={formatNumber(summary.winning_count)} />
        <StatCard
          label="กำไร/ขาดทุน"
          value={formatBaht(summary.profit)}
          tone={summary.profit >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการที่ถูกรางวัล ({winners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {winners.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีผู้ถูกรางวัล หรือยังไม่ได้กรอกผล</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เวลา</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>เลข</TableHead>
                  <TableHead className="text-right">ราคา</TableHead>
                  <TableHead className="text-right">เงินรางวัล</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {winners.map(({ ticket: t, prize }) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(t.created_at)}</TableCell>
                    <TableCell><TicketBadge betType={t.bet_type} /></TableCell>
                    <TableCell><TicketNumber number={t.number} isReverse={t.is_reverse} highlight /></TableCell>
                    <TableCell className="text-right">{formatBaht(t.price)}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-300">
                      {formatBaht(prize)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.customer_name || t.buyer_name || '-'}
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

function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  const color = tone === 'positive' ? 'text-emerald-600 dark:text-emerald-300'
    : tone === 'negative' ? 'text-red-600 dark:text-red-300'
    : '';
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`mt-1 text-lg font-semibold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
