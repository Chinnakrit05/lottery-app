'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CustomerCombobox } from '@/components/customer-combobox';
import { TicketBadge } from '@/components/ticket-badge';
import { TicketNumber } from '@/components/ticket-number';
import { dbClient } from '@/lib/db-client';
import { parseBulkInput, rowToTickets } from '@/lib/bulk-parser';
import { formatBaht } from '@/lib/format';
import type { Customer } from '@/types/database';
import { ListChecks, AlertCircle, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  roundId: number;
  onSaved: (savedTicketIds: number[], customer: Customer | null, summary: { count: number; total: number }) => void;
}

const PLACEHOLDER = `27 50
38 100
14ก 50      # ก = กลับ (50฿ + 50฿)
50ล 30      # ล = 2 ตัวล่าง
123 100
456ต 50     # ต = 3 ตัวโต๊ด
# บรรทัดขึ้น # คือ comment (ข้าม)`;

export function BulkEntry({ roundId, onSaved }: Props) {
  const [text, setText] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => parseBulkInput(text), [text]);
  const validRows = parsed.filter((r) => !r.error);
  const errorRows = parsed.filter((r) => r.error);

  const totalCount = validRows.reduce((sum, r) => sum + (r.reversePartner ? 2 : 1), 0);
  const totalAmount = validRows.reduce(
    (sum, r) => sum + (r.price ?? 0) * (r.reversePartner ? 2 : 1),
    0,
  );

  const handleSave = async () => {
    if (validRows.length === 0) {
      toast.error('ไม่มีรายการที่ถูกต้องให้บันทึก');
      return;
    }
    if (errorRows.length > 0) {
      if (!confirm(`พบ ${errorRows.length} บรรทัดที่ผิด — ข้ามและบันทึก ${totalCount} รายการที่เหลือ?`)) {
        return;
      }
    }
    setSaving(true);
    try {
      const tickets = rowToTickets(validRows, roundId, customer?.id ?? null, customer?.name ?? null);
      const count = await dbClient.tickets.createBulk(tickets);
      toast.success(`บันทึก ${count} รายการสำเร็จ`);
      setText('');
      onSaved([], customer, { count, total: totalAmount });
    } catch (e: any) {
      toast.error('บันทึกไม่สำเร็จ: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <Label>ลูกค้า (ไม่บังคับ)</Label>
          <CustomerCombobox value={customer} onChange={setCustomer} className="mt-1" />
        </div>

        <div>
          <Label htmlFor="bulk-input" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            พิมพ์ทีละบรรทัด · 1 บรรทัด = 1 รายการ
          </Label>
          <Textarea
            id="bulk-input"
            placeholder={PLACEHOLDER}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1.5 font-mono text-sm min-h-[200px]"
            spellCheck={false}
          />
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <Tip>เลข 2 หลัก → 2 ตัวบน</Tip>
            <Tip>{'"ล" ต่อท้าย → 2 ตัวล่าง'}</Tip>
            <Tip>{'"ก" ต่อท้าย → กลับด้วย'}</Tip>
            <Tip>{'"ต" (3 หลัก) → โต๊ด'}</Tip>
          </div>
        </div>

        {/* Preview */}
        {parsed.length > 0 && (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
              <span className="text-sm font-medium">
                📋 Preview — {totalCount} รายการ · {formatBaht(totalAmount)}
                {errorRows.length > 0 && (
                  <span className="ml-2 text-destructive">
                    · {errorRows.length} บรรทัดผิด
                  </span>
                )}
              </span>
            </div>
            <div className="max-h-[280px] overflow-y-auto divide-y">
              {parsed.map((r) => (
                <div
                  key={r.lineNo}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 text-sm',
                    r.error && 'bg-destructive/5',
                  )}
                >
                  <span className="font-mono text-muted-foreground w-8 text-right">{r.lineNo}</span>
                  {r.error ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <span className="text-muted-foreground flex-1 truncate font-mono">{r.raw}</span>
                      <span className="text-destructive text-xs">{r.error}</span>
                    </>
                  ) : (
                    <>
                      <TicketBadge betType={r.betType!} />
                      <TicketNumber number={r.number!} />
                      {r.reversePartner && (
                        <>
                          <span className="text-xs text-muted-foreground">+</span>
                          <TicketNumber number={r.reversePartner} isReverse />
                        </>
                      )}
                      <span className="ml-auto font-medium">
                        {formatBaht((r.price ?? 0) * (r.reversePartner ? 2 : 1))}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || validRows.length === 0}
            size="xl"
            className="min-w-[240px]"
          >
            {saving ? 'กำลังบันทึก…' : `💾 บันทึก ${totalCount > 0 ? `${totalCount} รายการ` : ''}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px]">💡 {children}</span>;
}
