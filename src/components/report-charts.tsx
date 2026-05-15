'use client';

import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BET_LABELS, BET_EMOJI } from '@/lib/constants';
import { formatBaht, formatNumber } from '@/lib/format';
import type { BetType } from '@/types/database';
import type { RoundSummary } from '@/lib/lottery';

interface TopItem {
  number: string;
  bet_type: BetType;
  count: number;
  amount: number;
}

const COLORS: Record<BetType, string> = {
  '2_top':    '#3b82f6',
  '2_bottom': '#06b6d4',
  '3_top':    '#f59e0b',
  '3_tod':    '#10b981',
};

export function ReportCharts({ summary, top }: { summary: RoundSummary; top: TopItem[] }) {
  const pieData = (Object.keys(summary.by_type) as BetType[])
    .map((k) => ({
      name: `${BET_EMOJI[k]} ${BET_LABELS[k]}`,
      key: k,
      value: summary.by_type[k].amount,
      count: summary.by_type[k].count,
    }))
    .filter((d) => d.value > 0);

  const barData = top.slice(0, 8).map((t) => ({
    name: t.number,
    amount: t.amount,
    bet_type: t.bet_type,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🥧 สัดส่วนยอดขายตามประเภท</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((d) => (
                    <Cell key={d.key} fill={COLORS[d.key]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatBaht(value)}
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {pieData.map((d) => (
              <div key={d.key} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS[d.key] }} />
                <span className="flex-1 truncate">{d.name}</span>
                <span className="font-medium">{formatNumber(d.count)} · {formatBaht(d.value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">📊 Top 8 เลขขายดี</CardTitle>
        </CardHeader>
        <CardContent>
          {barData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                />
                <Tooltip
                  formatter={(value: number) => formatBaht(value)}
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  cursor={{ fill: 'hsl(var(--accent) / 0.3)' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={COLORS[d.bet_type]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
      ยังไม่มีข้อมูล
    </div>
  );
}
