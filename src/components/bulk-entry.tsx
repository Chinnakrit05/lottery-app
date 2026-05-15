'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomerCombobox } from '@/components/customer-combobox';
import { dbClient } from '@/lib/db-client';
import { reverseNumber, normalizeNumber } from '@/lib/lottery';
import { formatBaht } from '@/lib/format';
import type { Customer, BetType } from '@/types/database';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Row2 {
  id: string;
  position: 'top' | 'bottom';
  number: string;
  priceDirect: string;
  priceReverse: string;
}

interface Row3 {
  id: string;
  number: string;
  priceTop: string;
  priceTod: string;
}

const newRow2 = (): Row2 => ({
  id: crypto.randomUUID(),
  position: 'top',
  number: '',
  priceDirect: '',
  priceReverse: '',
});

const newRow3 = (): Row3 => ({
  id: crypto.randomUUID(),
  number: '',
  priceTop: '',
  priceTod: '',
});

interface Props {
  roundId: number;
  onSaved: () => void;
}

export function BulkEntry({ roundId, onSaved }: Props) {
  const [rows2, setRows2] = useState<Row2[]>([newRow2(), newRow2(), newRow2()]);
  const [rows3, setRows3] = useState<Row3[]>([newRow3()]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const tickets = useMemo(() => {
    const out: Array<{
      bet_type: BetType;
      number: string;
      price: number;
      is_reverse: boolean;
    }> = [];

    // 2-digit rows
    for (const r of rows2) {
      const num = r.number.trim();
      if (num.length !== 2 || !/^\d{2}$/.test(num)) continue;
      const direct = Number(r.priceDirect) || 0;
      const reverse = Number(r.priceReverse) || 0;
      const betType: BetType = r.position === 'top' ? '2_top' : '2_bottom';
      if (direct > 0) {
        out.push({ bet_type: betType, number: num, price: direct, is_reverse: false });
      }
      if (reverse > 0) {
        const rev = reverseNumber(num);
        if (rev) {
          out.push({ bet_type: betType, number: rev, price: reverse, is_reverse: true });
        }
      }
    }

    // 3-digit rows
    for (const r of rows3) {
      const num = r.number.trim();
      if (num.length !== 3 || !/^\d{3}$/.test(num)) continue;
      const top = Number(r.priceTop) || 0;
      const tod = Number(r.priceTod) || 0;
      if (top > 0) {
        out.push({ bet_type: '3_top', number: num, price: top, is_reverse: false });
      }
      if (tod > 0) {
        out.push({
          bet_type: '3_tod',
          number: normalizeNumber(num, '3_tod'),
          price: tod,
          is_reverse: false,
        });
      }
    }

    return out;
  }, [rows2, rows3]);

  const totalAmount = tickets.reduce((s, t) => s + t.price, 0);

  const handleSave = async () => {
    if (tickets.length === 0) {
      toast.error('ยังไม่มีรายการ — กรอกเลข + ราคาอย่างน้อย 1 รายการ');
      return;
    }
    setSaving(true);
    try {
      const inputs = tickets.map((t) => ({
        round_id: roundId,
        customer_id: customer?.id ?? null,
        number: t.number,
        bet_type: t.bet_type,
        price: t.price,
        buyer_name: customer?.name ?? null,
        note: null,
        is_reverse: t.is_reverse,
      }));
      const count = await dbClient.tickets.createBulk(inputs);
      toast.success(`บันทึก ${count} รายการ • ${formatBaht(totalAmount)}`);
      // Reset
      setRows2([newRow2(), newRow2(), newRow2()]);
      setRows3([newRow3()]);
      onSaved();
    } catch (e: any) {
      toast.error('บันทึกไม่สำเร็จ: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <Label className="text-sm font-semibold">ลูกค้า (ไม่บังคับ — ใช้กับทุกรายการในตารางนี้)</Label>
          <CustomerCombobox value={customer} onChange={setCustomer} className="mt-1.5" />
        </CardContent>
      </Card>

      {/* 2-digit table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🔢 2 ตัว</CardTitle>
        </CardHeader>
        <CardContent>
          <Table2 rows={rows2} setRows={setRows2} />
        </CardContent>
      </Card>

      {/* 3-digit table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🎯 3 ตัว</CardTitle>
        </CardHeader>
        <CardContent>
          <Table3 rows={rows3} setRows={setRows3} />
        </CardContent>
      </Card>

      {/* Summary + Save */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs text-muted-foreground">รวมที่จะบันทึก</div>
            <div className="text-2xl font-bold mt-1">
              {tickets.length} รายการ · <span className="text-primary">{formatBaht(totalAmount)}</span>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || tickets.length === 0}
            size="xl"
            className="min-w-[200px]"
          >
            {saving ? 'กำลังบันทึก…' : '💾 บันทึกทั้งหมด'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// 2-digit table
// ============================================================
function Table2({ rows, setRows }: { rows: Row2[]; setRows: (r: Row2[]) => void }) {
  const update = (id: string, patch: Partial<Row2>) =>
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => setRows(rows.length > 1 ? rows.filter((r) => r.id !== id) : rows);
  const add = () => setRows([...rows, newRow2()]);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-muted-foreground border-b">
              <th className="text-left py-2 px-2 w-[120px]">บน/ล่าง</th>
              <th className="text-center py-2 px-2 w-[110px]">เลข</th>
              <th className="text-center py-2 px-2">ตรง</th>
              <th className="text-center py-2 px-2">กลับ</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const validNum = /^\d{2}$/.test(r.number);
              const palindrome = validNum && r.number[0] === r.number[1];
              return (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td className="py-2 px-2">
                    <PositionToggle value={r.position} onChange={(v) => update(r.id, { position: v })} />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      inputMode="numeric"
                      maxLength={2}
                      value={r.number}
                      onChange={(e) =>
                        update(r.id, { number: e.target.value.replace(/[^0-9]/g, '') })
                      }
                      placeholder="00"
                      className="h-11 text-center font-mono text-lg tracking-widest"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      inputMode="numeric"
                      value={r.priceDirect}
                      onChange={(e) =>
                        update(r.id, { priceDirect: e.target.value.replace(/[^0-9.]/g, '') })
                      }
                      placeholder="0"
                      className="h-11 text-center font-mono"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      inputMode="numeric"
                      value={r.priceReverse}
                      onChange={(e) =>
                        update(r.id, { priceReverse: e.target.value.replace(/[^0-9.]/g, '') })
                      }
                      placeholder={palindrome ? 'palindrome' : '0'}
                      disabled={palindrome}
                      className={cn(
                        'h-11 text-center font-mono',
                        palindrome && 'opacity-40',
                      )}
                      title={palindrome ? 'เลข palindrome ไม่มีกลับ' : undefined}
                    />
                  </td>
                  <td className="py-2 px-1 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(r.id)}
                      disabled={rows.length <= 1}
                      className="h-9 w-9"
                      title="ลบแถว"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Button variant="outline" onClick={add} className="w-full" size="lg">
        <Plus className="h-4 w-4 mr-2" />
        เพิ่มแถว
      </Button>
    </div>
  );
}

// ============================================================
// 3-digit table
// ============================================================
function Table3({ rows, setRows }: { rows: Row3[]; setRows: (r: Row3[]) => void }) {
  const update = (id: string, patch: Partial<Row3>) =>
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => setRows(rows.length > 1 ? rows.filter((r) => r.id !== id) : rows);
  const add = () => setRows([...rows, newRow3()]);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-muted-foreground border-b">
              <th className="text-center py-2 px-2 w-[140px]">เลข</th>
              <th className="text-center py-2 px-2">ตรง</th>
              <th className="text-center py-2 px-2">โต๊ด</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-b-0">
                <td className="py-2 px-2">
                  <Input
                    inputMode="numeric"
                    maxLength={3}
                    value={r.number}
                    onChange={(e) =>
                      update(r.id, { number: e.target.value.replace(/[^0-9]/g, '') })
                    }
                    placeholder="000"
                    className="h-11 text-center font-mono text-lg tracking-widest"
                  />
                </td>
                <td className="py-2 px-2">
                  <Input
                    inputMode="numeric"
                    value={r.priceTop}
                    onChange={(e) =>
                      update(r.id, { priceTop: e.target.value.replace(/[^0-9.]/g, '') })
                    }
                    placeholder="0"
                    className="h-11 text-center font-mono"
                  />
                </td>
                <td className="py-2 px-2">
                  <Input
                    inputMode="numeric"
                    value={r.priceTod}
                    onChange={(e) =>
                      update(r.id, { priceTod: e.target.value.replace(/[^0-9.]/g, '') })
                    }
                    placeholder="0"
                    className="h-11 text-center font-mono"
                  />
                </td>
                <td className="py-2 px-1 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(r.id)}
                    disabled={rows.length <= 1}
                    className="h-9 w-9"
                    title="ลบแถว"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" onClick={add} className="w-full" size="lg">
        <Plus className="h-4 w-4 mr-2" />
        เพิ่มแถว
      </Button>
    </div>
  );
}

// ============================================================
// บน / ล่าง toggle (compact)
// ============================================================
function PositionToggle({
  value,
  onChange,
}: {
  value: 'top' | 'bottom';
  onChange: (v: 'top' | 'bottom') => void;
}) {
  return (
    <div className="inline-flex rounded-lg border bg-muted p-0.5">
      <button
        type="button"
        onClick={() => onChange('top')}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all',
          value === 'top'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <ArrowUpCircle className="h-3.5 w-3.5" />
        บน
      </button>
      <button
        type="button"
        onClick={() => onChange('bottom')}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all',
          value === 'bottom'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <ArrowDownCircle className="h-3.5 w-3.5" />
        ล่าง
      </button>
    </div>
  );
}
