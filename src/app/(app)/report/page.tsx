'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoRound } from '@/components/no-round';
import { useCurrentRoundCtx } from '@/contexts/current-round';
import { dbClient } from '@/lib/db-client';
import type { TicketWithCustomer } from '@/types/database';
import { BET_LABELS } from '@/lib/constants';
import { summarizeRound, topNumbers } from '@/lib/lottery';
import { formatBaht, formatNumber } from '@/lib/format';
import { TicketBadge } from '@/components/ticket-badge';
import { TicketNumber } from '@/components/ticket-number';

export default function ReportPage() {
  const { currentRound } = useCurrentRoundCtx();
  const [tickets, setTickets] = useState<TicketWithCustomer[]>([]);

  useEffect(() => {
    if (!currentRound) return;
    dbClient.tickets.listByRound(currentRound.id).then(setTickets);
  }, [currentRound]);

  if (!currentRound) return <NoRound />;

  const summary = summarizeRound(tickets, currentRound);
  const top = topNumbers(tickets, 10);
  const avgTicket = summary.total_count > 0 ? summary.total_amount / summary.total_count : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="จำนวนรายการ" value={formatNumber(summary.total_count)} />
        <StatCard label="ยอดขายรวม" value={formatBaht(summary.total_amount)} />
        <StatCard label="เฉลี่ย/รายการ" value={formatBaht(avgTicket)} />
        <StatCard label={`หัก ${currentRound.deduct_percent}%`} value={formatBaht(summary.deduct_amount)} />
        <StatCard label="ยอดหลังหัก" value={formatBaht(summary.net_amount)} highlight />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>สรุปแยกตามประเภท</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(['2_top', '2_bottom', '3_top', '3_tod'] as const).map((t) => {
              const item = summary.by_type[t];
              const pct = summary.total_amount > 0 ? (item.amount / summary.total_amount) * 100 : 0;
              return (
                <div key={t} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <TicketBadge betType={t} />
                    <span className="text-sm text-muted-foreground">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-sm">{formatNumber(item.count)} รายการ</span>
                    <span className="text-base font-semibold">{formatBaht(item.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔥 Top 10 เลขขายดี</CardTitle>
        </CardHeader>
        <CardContent>
          {top.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีข้อมูล</div>
          ) : (
            <ul className="space-y-2">
              {top.map((t, idx) => (
                <li key={`${t.bet_type}-${t.number}`} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-muted-foreground w-6">#{idx + 1}</span>
                    <TicketBadge betType={t.bet_type} />
                    <TicketNumber number={t.number} />
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground mr-2">{t.count} ครั้ง</span>
                    <span className="font-semibold">{formatBaht(t.amount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`mt-1 text-xl font-semibold ${highlight ? 'text-primary' : ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
