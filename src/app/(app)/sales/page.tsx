'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';
import { BetTypeButtons } from '@/components/bet-type-buttons';
import { CustomerCombobox } from '@/components/customer-combobox';
import { NoRound } from '@/components/no-round';
import { TicketBadge } from '@/components/ticket-badge';
import { TicketNumber } from '@/components/ticket-number';
import { useCurrentRoundCtx } from '@/contexts/current-round';
import { dbClient } from '@/lib/db-client';
import type { BetType, Customer, TicketWithCustomer } from '@/types/database';
import { getBetDigits } from '@/lib/constants';
import { normalizeNumber, validateNumber, reverseNumber } from '@/lib/lottery';
import { formatBaht, formatDateTime } from '@/lib/format';

export default function SalesPage() {
  const { currentRound, currentRoundId } = useCurrentRoundCtx();
  const [betType, setBetType] = useState<BetType>('2_top');
  const [reverse, setReverse] = useState(false);
  const [number, setNumber] = useState('');
  const [price, setPrice] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [recent, setRecent] = useState<TicketWithCustomer[]>([]);
  const priceRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);

  const digits = getBetDigits(betType);
  const canReverse = betType === '2_top' || betType === '2_bottom';

  const loadRecent = async () => {
    if (!currentRoundId) return;
    const rows = await dbClient.tickets.listRecent(currentRoundId, 10);
    setRecent(rows);
  };

  useEffect(() => {
    loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoundId]);

  if (!currentRound) return <NoRound />;

  const handleSave = async () => {
    const err = validateNumber(number, betType);
    if (err) return toast.error(err);
    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) return toast.error('กรุณากรอกราคา > 0');

    setSaving(true);
    try {
      const normalized = normalizeNumber(number, betType);
      const rows = [
        {
          round_id: currentRound.id,
          customer_id: customer?.id ?? null,
          number: normalized,
          bet_type: betType,
          price: priceNum,
          buyer_name: customer?.name ?? null,
          note: note || null,
          is_reverse: false,
        },
      ];
      if (reverse && canReverse) {
        const rev = reverseNumber(normalized);
        if (rev) {
          rows.push({
            round_id: currentRound.id,
            customer_id: customer?.id ?? null,
            number: rev,
            bet_type: betType,
            price: priceNum,
            buyer_name: customer?.name ?? null,
            note: note || null,
            is_reverse: true,
          });
        }
      }
      await dbClient.tickets.createBulk(rows);
      toast.success(`บันทึก ${rows.length} รายการ`);
      setNumber('');
      setPrice('');
      setNote('');
      // keep customer + betType + reverse for rapid entry
      numberRef.current?.focus();
      loadRecent();
    } catch (e: any) {
      toast.error('บันทึกไม่สำเร็จ: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await dbClient.tickets.delete(id);
    toast.success('ลบรายการแล้ว');
    loadRecent();
  };

  return (
    <div className="space-y-5 max-w-5xl animate-page-enter">
      <Card>
        <CardHeader>
          <CardTitle>📝 บันทึกการขาย</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>ประเภท</Label>
            <BetTypeButtons value={betType} onChange={setBetType} className="mt-2" />
          </div>
          {canReverse && (
            <Checkbox
              checked={reverse}
              onChange={(e) => setReverse(e.target.checked)}
              label="กลับด้วย (บันทึกเลขกลับเพิ่ม)"
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="number" className="text-sm font-semibold">เลข ({digits} หลัก)</Label>
              <Input
                id="number"
                ref={numberRef}
                inputMode="numeric"
                maxLength={digits}
                placeholder={'0'.repeat(digits)}
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    priceRef.current?.focus();
                  }
                }}
                className="h-14 text-2xl font-mono tracking-[0.4em] text-center mt-1.5"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="price" className="text-sm font-semibold">ราคา (บาท)</Label>
              <Input
                id="price"
                ref={priceRef}
                inputMode="numeric"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                className="h-14 text-2xl font-semibold text-center mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label>ลูกค้า (ไม่บังคับ)</Label>
            <CustomerCombobox value={customer} onChange={setCustomer} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="note">หมายเหตุ (ไม่บังคับ)</Label>
            <Textarea
              id="note"
              placeholder=""
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} size="xl" className="min-w-[200px]">
              {saving ? 'กำลังบันทึก…' : '💾 บันทึก (Enter)'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการล่าสุด ({recent.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <div className="text-4xl mb-2">📭</div>
              ยังไม่มีรายการ — กรอกเลขด้านบนเพื่อเริ่มบันทึก
            </div>
          ) : (
            <ul className="divide-y">
              {recent.map((r, idx) => (
                <li
                  key={r.id}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  className="flex items-center justify-between gap-3 py-3 px-1 rounded-lg hover:bg-accent/40 transition-colors animate-fade-in"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <TicketBadge betType={r.bet_type} />
                    <TicketNumber number={r.number} isReverse={r.is_reverse} />
                    <span className="text-sm font-medium">{formatBaht(r.price)}</span>
                    {(r.customer_name || r.buyer_name) && (
                      <span className="text-xs text-muted-foreground">👤 {r.customer_name || r.buyer_name}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} title="ลบ">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
