'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { dbClient } from '@/lib/db-client';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { useCurrentRoundCtx } from '@/contexts/current-round';
import { formatNumber } from '@/lib/format';

export default function BackupPage() {
  const { refresh } = useCurrentRoundCtx();
  const [stats, setStats] = useState<{ rounds: number; customers: number; tickets: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const load = async () => setStats(await dbClient.backup.stats());
  useEffect(() => { load(); }, []);

  const doExport = async () => {
    setBusy(true);
    try {
      const res = await dbClient.backup.export();
      if (res.ok) toast.success(`Export สำเร็จ → ${res.path}`);
      else if (!res.canceled) toast.error(res.error || 'Export ล้มเหลว');
    } finally {
      setBusy(false);
    }
  };

  const doImport = async (mode: 'merge' | 'replace') => {
    if (mode === 'replace' && confirmText !== 'REPLACE') {
      return toast.error('พิมพ์ REPLACE ในช่องยืนยันก่อน');
    }
    setBusy(true);
    try {
      const res = await dbClient.backup.import(mode);
      if (res.ok) {
        toast.success('Import สำเร็จ');
        setConfirmText('');
        await load();
        await refresh();
      } else if (!res.canceled) {
        toast.error(res.error || 'Import ล้มเหลว');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="py-4"><div className="text-xs text-muted-foreground">งวด</div><div className="text-2xl font-semibold">{stats ? formatNumber(stats.rounds) : '—'}</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-xs text-muted-foreground">ลูกค้า</div><div className="text-2xl font-semibold">{stats ? formatNumber(stats.customers) : '—'}</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-xs text-muted-foreground">รายการขาย</div><div className="text-2xl font-semibold">{stats ? formatNumber(stats.tickets) : '—'}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Export</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            สำรองทุก งวด + ลูกค้า + รายการขาย ลงไฟล์ JSON 1 ไฟล์
          </p>
          <Button onClick={doExport} disabled={busy}>📤 Export ทั้งหมด (JSON)</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              <b>เพิ่มเข้าไป (merge):</b> ปลอดภัย เก็บของเดิม + เพิ่มข้อมูลใหม่
            </p>
            <Button onClick={() => doImport('merge')} disabled={busy} variant="secondary">
              ➕ Import แบบ Merge
            </Button>
          </div>

          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <AlertTriangle className="h-5 w-5" /> Danger Zone
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              <b>แทนที่ทั้งหมด (replace):</b> ลบของเดิมทั้งหมดก่อน import ใหม่ — ห้ามกู้คืนได้
            </p>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="พิมพ์ REPLACE เพื่อยืนยัน"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="max-w-xs"
              />
              <Button
                variant="destructive"
                onClick={() => doImport('replace')}
                disabled={busy || confirmText !== 'REPLACE'}
              >
                ⚠️ Import แบบแทนที่ทั้งหมด
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
