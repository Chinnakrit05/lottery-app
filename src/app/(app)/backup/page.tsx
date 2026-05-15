'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { dbClient } from '@/lib/db-client';
import { Download, Upload, AlertTriangle, FileJson, Calendar, Package } from 'lucide-react';
import { useCurrentRoundCtx } from '@/contexts/current-round';
import { formatNumber, formatDateTime } from '@/lib/format';

type PreviewMeta = NonNullable<Awaited<ReturnType<typeof dbClient.backup.preview>>['meta']>;

export default function BackupPage() {
  const { refresh } = useCurrentRoundCtx();
  const [stats, setStats] = useState<{ rounds: number; customers: number; tickets: number } | null>(null);
  const [busy, setBusy] = useState(false);

  // import flow
  const [pendingFile, setPendingFile] = useState<{ path: string; meta: PreviewMeta } | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [confirmText, setConfirmText] = useState('');

  const load = async () => setStats(await dbClient.backup.stats());
  useEffect(() => { load(); }, []);

  const doExport = async () => {
    setBusy(true);
    try {
      const res = await dbClient.backup.export();
      if (res.ok) {
        toast.success(`Export สำเร็จ`, {
          description:
            `${res.stats?.rounds ?? 0} งวด · ${res.stats?.customers ?? 0} ลูกค้า · ${res.stats?.tickets ?? 0} รายการ → ${res.path}`,
          duration: 7000,
        });
      } else if (!res.canceled) {
        toast.error(res.error || 'Export ล้มเหลว');
      }
    } finally {
      setBusy(false);
    }
  };

  // Pick file + preview
  const startImport = async (selectedMode: 'merge' | 'replace') => {
    setMode(selectedMode);
    setConfirmText('');
    setBusy(true);
    try {
      const res = await dbClient.backup.preview();
      if (res.ok && res.filePath && res.meta) {
        setPendingFile({ path: res.filePath, meta: res.meta });
      } else if (!res.canceled) {
        toast.error(res.error || 'อ่านไฟล์ไม่สำเร็จ');
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmImport = async () => {
    if (!pendingFile) return;
    if (mode === 'replace' && confirmText !== 'REPLACE') {
      toast.error('พิมพ์ REPLACE เพื่อยืนยัน');
      return;
    }
    setBusy(true);
    try {
      const res = await dbClient.backup.import(mode, pendingFile.path);
      if (res.ok) {
        toast.success('Import สำเร็จ', {
          description: res.stats
            ? `${res.stats.rounds} งวด · ${res.stats.customers} ลูกค้า · ${res.stats.tickets} รายการ${res.stats.skipped > 0 ? ` (ข้าม ${res.stats.skipped})` : ''}`
            : undefined,
          duration: 7000,
        });
        setPendingFile(null);
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
    <div className="space-y-4 max-w-4xl animate-page-enter">
      {/* Current stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="งวด" value={stats?.rounds} icon={<Calendar className="h-4 w-4" />} />
        <StatTile label="ลูกค้า" value={stats?.customers} icon={<Package className="h-4 w-4" />} />
        <StatTile label="รายการขาย" value={stats?.tickets} icon={<FileJson className="h-4 w-4" />} />
      </div>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" /> Export — สำรองข้อมูล
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            สำรองทุก <b>งวด + ลูกค้า + รายการขาย</b> ลงไฟล์ JSON 1 ไฟล์
            ไฟล์จะถูกตั้งชื่อเป็น <code className="text-xs bg-muted px-1.5 py-0.5 rounded">lovenumber-backup-YYYY-MM-DD.json</code>
          </p>
          <Button onClick={doExport} disabled={busy} size="lg">
            <Download className="h-4 w-4 mr-2" />
            📤 Export ทั้งหมด (JSON)
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Import — กู้คืน/รวมข้อมูล
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-secondary/30 p-4">
            <p className="text-sm font-medium mb-2">➕ เพิ่มเข้าไป (Merge) <span className="text-muted-foreground font-normal">— ปลอดภัย</span></p>
            <p className="text-xs text-muted-foreground mb-3">
              เก็บข้อมูลเดิมไว้ + เพิ่มข้อมูลจากไฟล์เข้ามา (ID ใหม่ทั้งหมด)
            </p>
            <Button onClick={() => startImport('merge')} disabled={busy} variant="secondary" size="lg">
              เลือกไฟล์ + Preview
            </Button>
          </div>

          <div className="rounded-lg border-2 border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-destructive font-medium mb-2">
              <AlertTriangle className="h-5 w-5" /> แทนที่ทั้งหมด (Replace)
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              ⚠️ <b>ลบข้อมูลเดิมทั้งหมด</b>ก่อน import ใหม่ — ระบบจะ snapshot DB ปัจจุบันไว้กันก่อน
              แต่ไม่ควรเชื่อใจ — ควร Export ก่อนเสมอ
            </p>
            <Button onClick={() => startImport('replace')} disabled={busy} variant="destructive" size="lg">
              เลือกไฟล์ + Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview dialog */}
      <Dialog open={!!pendingFile} onOpenChange={(o) => !o && setPendingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === 'replace' ? '⚠️ ยืนยันการแทนที่ทั้งหมด' : '➕ ยืนยันการเพิ่มข้อมูล'}
            </DialogTitle>
            <DialogDescription>ตรวจสอบข้อมูลในไฟล์ก่อนยืนยัน</DialogDescription>
          </DialogHeader>

          {pendingFile && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-card p-3 space-y-1.5 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">ที่มา</div>
                  <div className="text-right truncate">
                    {pendingFile.meta.product_name ?? '-'} v{pendingFile.meta.app_version ?? '?'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">วันที่ Export</div>
                  <div className="text-right">{formatDateTime(pendingFile.meta.exported_at)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">ขนาดไฟล์</div>
                  <div className="text-right">{(pendingFile.meta.size_bytes / 1024).toFixed(1)} KB</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Format</div>
                  <div className="text-right">v{pendingFile.meta.format_version}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <PreviewTile label="งวด" value={pendingFile.meta.rounds} />
                <PreviewTile label="ลูกค้า" value={pendingFile.meta.customers} />
                <PreviewTile label="รายการขาย" value={pendingFile.meta.tickets} />
              </div>

              {mode === 'replace' && (
                <div className="rounded-lg border-2 border-destructive/50 bg-destructive/10 p-3 space-y-2">
                  <p className="text-sm text-destructive font-semibold">
                    การลบข้อมูลเดิมจะ ไม่สามารถกู้คืนได้ (ยกเว้น snapshot ของระบบ)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    พิมพ์ <code className="bg-background px-1.5 py-0.5 rounded font-mono">REPLACE</code> เพื่อยืนยัน:
                  </p>
                  <Input
                    placeholder="พิมพ์ REPLACE"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingFile(null)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button
              variant={mode === 'replace' ? 'destructive' : 'default'}
              onClick={confirmImport}
              disabled={busy || (mode === 'replace' && confirmText !== 'REPLACE')}
            >
              {busy ? 'กำลังนำเข้า…' : (mode === 'replace' ? '⚠️ แทนที่ทั้งหมด' : '➕ เพิ่มเข้าไป')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: number | undefined; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="text-2xl font-bold mt-1">{value !== undefined ? formatNumber(value) : '—'}</div>
      </CardContent>
    </Card>
  );
}

function PreviewTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold tabular-nums">{formatNumber(value)}</div>
    </div>
  );
}
