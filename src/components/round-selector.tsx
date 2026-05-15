'use client';

import { useState } from 'react';
import { Plus, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Round } from '@/types/database';
import { dbClient } from '@/lib/db-client';
import { isRoundDrawn } from '@/lib/lottery';

interface Props {
  rounds: Round[];
  currentRoundId: number | null;
  onChange: (id: number) => void;
  onRoundsChanged: () => void;
}

export function RoundSelector({ rounds, currentRoundId, onChange, onRoundsChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('กรุณากรอกชื่องวด');
      return;
    }
    setSaving(true);
    try {
      const round = await dbClient.rounds.create({
        name: name.trim(),
        draw_date: drawDate || null,
      });
      toast.success('สร้างงวดใหม่สำเร็จ');
      setName('');
      setDrawDate('');
      setOpen(false);
      onRoundsChanged();
      onChange(round.id);
    } catch (e: any) {
      toast.error('สร้างไม่สำเร็จ: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const current = rounds.find((r) => r.id === currentRoundId);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentRoundId ? String(currentRoundId) : ''}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="เลือกงวด" />
        </SelectTrigger>
        <SelectContent>
          {rounds.map((r) => (
            <SelectItem key={r.id} value={String(r.id)}>
              {r.name} {isRoundDrawn(r) && '🏆'}
            </SelectItem>
          ))}
          {rounds.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">ยังไม่มีงวด</div>
          )}
        </SelectContent>
      </Select>

      {current && isRoundDrawn(current) && (
        <Badge variant="warning" className="gap-1">
          <Trophy className="h-3 w-3" />
          ผลออกแล้ว
        </Badge>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" title="สร้างงวดใหม่">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างงวดใหม่</DialogTitle>
            <DialogDescription>เพิ่มงวดหวยใหม่ — กำหนดอัตราจ่ายได้ในหน้าตั้งค่าภายหลัง</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="round-name">ชื่องวด *</Label>
              <Input
                id="round-name"
                placeholder="เช่น 16 พ.ค. 2569"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="round-date">วันออกผล (ไม่บังคับ)</Label>
              <Input
                id="round-date"
                type="date"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>ยกเลิก</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'กำลังบันทึก…' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
