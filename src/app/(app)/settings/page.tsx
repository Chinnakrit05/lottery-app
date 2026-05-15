'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { NoRound } from '@/components/no-round';
import { UpdateSection } from '@/components/update-section';
import { FontScaleSelector } from '@/components/font-scale-selector';
import { useCurrentRoundCtx } from '@/contexts/current-round';
import { dbClient } from '@/lib/db-client';
import { AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { currentRound, refresh } = useCurrentRoundCtx();
  const [form, setForm] = useState({
    name: '',
    draw_date: '',
    rate_2_top: 70,
    rate_2_bottom: 70,
    rate_3_top: 500,
    rate_3_tod: 100,
    deduct_percent: 30,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentRound) return;
    setForm({
      name: currentRound.name,
      draw_date: currentRound.draw_date || '',
      rate_2_top: currentRound.rate_2_top,
      rate_2_bottom: currentRound.rate_2_bottom,
      rate_3_top: currentRound.rate_3_top,
      rate_3_tod: currentRound.rate_3_tod,
      deduct_percent: currentRound.deduct_percent,
    });
  }, [currentRound]);

  if (!currentRound) {
    return (
      <div className="space-y-4 max-w-3xl">
        <NoRound />
        <FontScaleSelector />
        <UpdateSection />
      </div>
    );
  }

  const save = async () => {
    if (!form.name.trim()) return toast.error('กรุณากรอกชื่องวด');
    setSaving(true);
    try {
      await dbClient.rounds.update(currentRound.id, {
        name: form.name.trim(),
        draw_date: form.draw_date || null,
        rate_2_top: Number(form.rate_2_top),
        rate_2_bottom: Number(form.rate_2_bottom),
        rate_3_top: Number(form.rate_3_top),
        rate_3_tod: Number(form.rate_3_tod),
        deduct_percent: Number(form.deduct_percent),
      });
      toast.success('บันทึกแล้ว');
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`ลบงวด "${currentRound.name}" และรายการทั้งหมด? ไม่สามารถกู้คืนได้`)) return;
    await dbClient.rounds.delete(currentRound.id);
    toast.success('ลบงวดแล้ว');
    refresh();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>⚙️ ตั้งค่างวด — {currentRound.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>ชื่องวด</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>วันออกผล</Label>
              <Input type="date" value={form.draw_date} onChange={(e) => setForm({ ...form, draw_date: e.target.value })} />
            </div>
          </div>

          <div>
            <Label className="text-base">อัตราจ่าย (บาทต่อบาท)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              <NumberField label="2 ตัวบน" value={form.rate_2_top} onChange={(v) => setForm({ ...form, rate_2_top: v })} />
              <NumberField label="2 ตัวล่าง" value={form.rate_2_bottom} onChange={(v) => setForm({ ...form, rate_2_bottom: v })} />
              <NumberField label="3 ตัวบน" value={form.rate_3_top} onChange={(v) => setForm({ ...form, rate_3_top: v })} />
              <NumberField label="3 ตัวโต๊ด" value={form.rate_3_tod} onChange={(v) => setForm({ ...form, rate_3_tod: v })} />
            </div>
          </div>

          <div className="max-w-xs">
            <Label>หัก %</Label>
            <Input
              type="number"
              value={form.deduct_percent}
              onChange={(e) => setForm({ ...form, deduct_percent: Number(e.target.value) })}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>{saving ? 'กำลังบันทึก…' : 'บันทึก'}</Button>
          </div>
        </CardContent>
      </Card>

      <FontScaleSelector />

      <UpdateSection />

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            ลบงวดนี้และรายการขายทั้งหมดในงวด ไม่สามารถกู้คืนได้
          </p>
          <Button variant="destructive" onClick={remove}>ลบงวดและข้อมูลทั้งหมดในงวดนี้</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
