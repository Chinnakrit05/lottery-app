'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { dbClient } from '@/lib/db-client';
import type { CustomerStats } from '@/types/database';
import { formatBaht, formatNumber } from '@/lib/format';

interface FormState {
  id?: number;
  name: string;
  phone: string;
  note: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerStats[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', phone: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => setCustomers(await dbClient.customers.stats());
  useEffect(() => { load(); }, []);

  const filtered = customers.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone || '').includes(query);
  });

  const openCreate = () => {
    setForm({ name: '', phone: '', note: '' });
    setOpen(true);
  };
  const openEdit = (c: CustomerStats) => {
    setForm({ id: c.id, name: c.name, phone: c.phone || '', note: c.note || '' });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('กรุณากรอกชื่อ');
    setSaving(true);
    try {
      if (form.id) {
        await dbClient.customers.update(form.id, {
          name: form.name.trim(),
          phone: form.phone || null,
          note: form.note || null,
        });
        toast.success('บันทึกการแก้ไขแล้ว');
      } else {
        await dbClient.customers.create({
          name: form.name.trim(),
          phone: form.phone || null,
          note: form.note || null,
        });
        toast.success('เพิ่มลูกค้าใหม่');
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: CustomerStats) => {
    if (!confirm(`ลบลูกค้า "${c.name}"? รายการขายจะยังอยู่ (customer_id = null)`)) return;
    await dbClient.customers.delete(c.id);
    toast.success('ลบแล้ว');
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>👥 ลูกค้า ({customers.length})</span>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" /> เพิ่มลูกค้า
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{form.id ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>ชื่อ *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
                  </div>
                  <div>
                    <Label>เบอร์โทร</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>หมายเหตุ</Label>
                    <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>ยกเลิก</Button>
                  <Button onClick={save} disabled={saving}>{saving ? 'กำลังบันทึก…' : 'บันทึก'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาด้วยชื่อหรือเบอร์…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีลูกค้า</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>เบอร์</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead className="text-right">ยอดซื้อรวม</TableHead>
                  <TableHead>หมายเหตุ</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">👤 {c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.phone || '-'}</TableCell>
                    <TableCell className="text-right">{formatNumber(c.ticket_count)}</TableCell>
                    <TableCell className="text-right">{formatBaht(c.total_amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{c.note || '-'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(c)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
