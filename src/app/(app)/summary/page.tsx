'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NoRound } from '@/components/no-round';
import { useCurrentRoundCtx } from '@/contexts/current-round';
import { dbClient } from '@/lib/db-client';
import { calculatePrize } from '@/lib/lottery';
import type { TicketWithCustomer, BetType } from '@/types/database';
import { formatBaht } from '@/lib/format';
import { BET_LABELS } from '@/lib/constants';
import { Save, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SummaryPage() {
  const { currentRound, refresh } = useCurrentRoundCtx();
  const [tickets, setTickets] = useState<TicketWithCustomer[]>([]);
  const [deductPct, setDeductPct] = useState<string>('30');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentRound) return;
    setDeductPct(String(currentRound.deduct_percent));
    dbClient.tickets.listByRound(currentRound.id).then(setTickets);
  }, [currentRound]);

  const calc = useMemo(() => {
    if (!currentRound) return null;
    const grossSales = tickets.reduce((s, t) => s + t.price, 0);
    const pct = Number(deductPct) || 0;
    const deductAmount = (grossSales * pct) / 100;

    // Payouts per bet type
    const payoutByType: Record<BetType, number> = {
      '2_top':    0,
      '2_bottom': 0,
      '3_top':    0,
      '3_tod':    0,
    };
    for (const t of tickets) {
      const prize = calculatePrize(t, currentRound);
      if (prize > 0) payoutByType[t.bet_type] += prize;
    }
    const totalPayout = Object.values(payoutByType).reduce((a, b) => a + b, 0);
    const total = grossSales - deductAmount - totalPayout;

    return { grossSales, pct, deductAmount, payoutByType, totalPayout, total };
  }, [tickets, currentRound, deductPct]);

  if (!currentRound) return <NoRound />;
  if (!calc) return null;

  const dirty = Number(deductPct) !== currentRound.deduct_percent;

  const savePercent = async () => {
    const pct = Number(deductPct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('% ต้องอยู่ระหว่าง 0-100');
      return;
    }
    setSaving(true);
    try {
      await dbClient.rounds.update(currentRound.id, { deduct_percent: pct });
      toast.success(`บันทึก % เป็น ${pct} แล้ว`);
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl animate-page-enter">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            สรุปยอด — {currentRound.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Spreadsheet-style table */}
          <div className="rounded-xl border-2 overflow-hidden">
            {/* Header row — ยอดขาย */}
            <Row
              label="ยอดขาย"
              value={calc.grossSales}
              variant="header"
            />

            {/* Deduct % row — editable */}
            <div className="grid grid-cols-[1fr_auto] items-center border-b bg-card">
              <div className="px-4 py-3 flex items-center gap-3">
                <span className="font-medium">หัก</span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={deductPct}
                    onChange={(e) => setDeductPct(e.target.value)}
                    className="w-20 h-9 text-center font-bold text-base"
                  />
                  <span className="text-base font-medium">%</span>
                </div>
                {dirty && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={savePercent}
                    disabled={saving}
                    className="h-8"
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    {saving ? 'กำลังบันทึก…' : 'บันทึก'}
                  </Button>
                )}
              </div>
              <div className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-red-600 dark:text-red-300 min-w-[140px]">
                −{formatBaht(calc.deductAmount)}
              </div>
            </div>

            {/* Payout rows */}
            <Row
              label="ยอดถูก 2 ตัวบน"
              value={-calc.payoutByType['2_top']}
              variant="payout"
              empty={calc.payoutByType['2_top'] === 0}
            />
            <Row
              label="ยอดถูก 2 ตัวล่าง"
              value={-calc.payoutByType['2_bottom']}
              variant="payout"
              empty={calc.payoutByType['2_bottom'] === 0}
            />
            <Row
              label="ยอดถูก 3 ตัวตรง"
              value={-calc.payoutByType['3_top']}
              variant="payout"
              empty={calc.payoutByType['3_top'] === 0}
            />
            <Row
              label="ยอดถูกโต๊ด"
              value={-calc.payoutByType['3_tod']}
              variant="payout"
              empty={calc.payoutByType['3_tod'] === 0}
            />

            {/* Total row */}
            <Row
              label="Total (สุทธิ)"
              value={calc.total}
              variant="total"
              positive={calc.total >= 0}
            />
          </div>

          {/* Quick stats below */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
            <MiniStat label="รายการทั้งหมด" value={`${tickets.length}`} />
            <MiniStat label="ยอดถูกรวม" value={formatBaht(calc.totalPayout)} />
            <MiniStat
              label={calc.total >= 0 ? 'กำไร' : 'ขาดทุน'}
              value={formatBaht(Math.abs(calc.total))}
              tone={calc.total >= 0 ? 'positive' : 'negative'}
            />
          </div>

          {/* Hint */}
          <div className="rounded-md bg-muted/40 border p-3 text-xs text-muted-foreground space-y-1">
            <p>
              <b>สูตร:</b> Total = ยอดขาย − (ยอดขาย × %) − ยอดถูกทั้งหมด
            </p>
            <p>
              💡 แก้ % แล้วจะเห็นยอดเปลี่ยนทันที — กดปุ่ม &ldquo;บันทึก&rdquo; ถ้าต้องการเก็บถาวร
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface RowProps {
  label: string;
  value: number;
  variant: 'header' | 'payout' | 'total';
  empty?: boolean;
  positive?: boolean;
}

function Row({ label, value, variant, empty, positive }: RowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_auto] items-center border-b last:border-b-0',
        variant === 'header' && 'bg-emerald-500/10 dark:bg-emerald-500/20',
        variant === 'payout' && 'bg-card',
        variant === 'total' && (positive
          ? 'bg-emerald-500/20 dark:bg-emerald-500/30 border-t-2'
          : 'bg-red-500/20 dark:bg-red-500/30 border-t-2'),
        empty && 'opacity-50',
      )}
    >
      <div
        className={cn(
          'px-4 py-3',
          variant === 'header' && 'font-bold text-base',
          variant === 'total' && 'font-bold text-base flex items-center gap-2',
        )}
      >
        {variant === 'total' && (
          positive
            ? <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            : <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-300" />
        )}
        {label}
      </div>
      <div
        className={cn(
          'px-4 py-3 text-right font-mono tabular-nums min-w-[140px]',
          variant === 'header' && 'font-bold text-base',
          variant === 'payout' && value < 0 && 'text-red-600 dark:text-red-300',
          variant === 'total' && 'font-bold text-lg',
          variant === 'total' && positive && 'text-emerald-700 dark:text-emerald-300',
          variant === 'total' && !positive && 'text-red-700 dark:text-red-300',
        )}
      >
        {variant === 'payout' && value < 0 && '−'}
        {formatBaht(Math.abs(value))}
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn(
        'text-sm font-semibold mt-0.5 font-mono tabular-nums',
        tone === 'positive' && 'text-emerald-600 dark:text-emerald-300',
        tone === 'negative' && 'text-red-600 dark:text-red-300',
      )}>
        {value}
      </div>
    </div>
  );
}
