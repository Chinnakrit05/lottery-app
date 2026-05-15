'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RefreshCw, Check, Download, AlertCircle, Sparkles, Info,
} from 'lucide-react';
import type { UpdateStatus } from '@/types/electron-api';

function isElectronWithUpdate() {
  return typeof window !== 'undefined' && !!window.api?.update;
}

export function UpdateSection() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isElectronWithUpdate()) return;
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const initial = await window.api.update.getStatus();
        setStatus(initial);
      } catch {
        // ignore
      }
      unsub = window.api.update.onStatus((s) => setStatus(s));
    })();
    return () => unsub?.();
  }, []);

  const handleCheck = async () => {
    if (!isElectronWithUpdate()) return;
    setChecking(true);
    try {
      const res = await window.api.update.check();
      if (!res.ok) {
        toast.error('ไม่สามารถเช็คอัพเดทได้: ' + (res.error || 'unknown'));
      } else if (!res.version) {
        toast.info('ใช้เวอร์ชั่นล่าสุดอยู่แล้ว ✓');
      } else {
        toast.message(`พบเวอร์ชั่นใหม่: v${res.version}`, {
          description: 'กดปุ่ม "ดาวน์โหลด" ด้านล่างเพื่ออัพเดท',
        });
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setChecking(false);
    }
  };

  const handleDownload = async () => {
    if (!isElectronWithUpdate()) return;
    try {
      const res = await window.api.update.download();
      if (!res.ok) {
        toast.error('ดาวน์โหลดไม่สำเร็จ: ' + (res.error || 'unknown'));
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
  };

  const handleRestart = () => {
    if (!isElectronWithUpdate()) return;
    window.api.update.restartAndInstall();
  };

  const currentVersion = status.version || '?';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          เกี่ยวกับแอป
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <div className="text-xs text-muted-foreground">เวอร์ชั่นที่ใช้อยู่</div>
            <div className="font-semibold text-lg">v{currentVersion}</div>
          </div>
          <Button variant="outline" onClick={handleCheck} disabled={checking || status.state === 'downloading'}>
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'กำลังเช็ค…' : 'เช็คอัพเดท'}
          </Button>
        </div>

        <UpdateStatusDisplay
          status={status}
          onDownload={handleDownload}
          onRestart={handleRestart}
        />

        <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
          <p>🐱 Love Number — ระบบจัดการหวยแบบ offline</p>
          <p>🔄 ระบบจะเช็คอัพเดทอัตโนมัติทุก 30 นาที — หรือกดปุ่มข้างบนเพื่อเช็คเอง</p>
          <p>💾 ข้อมูลทั้งหมดเก็บไว้ในเครื่อง — ไม่มีการส่งข้อมูลออก</p>
        </div>
      </CardContent>
    </Card>
  );
}

function UpdateStatusDisplay({
  status, onDownload, onRestart,
}: {
  status: UpdateStatus;
  onDownload: () => void;
  onRestart: () => void;
}) {
  if (status.state === 'idle' || status.state === 'none') {
    return (
      <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
        <Check className="h-4 w-4" />
        ใช้เวอร์ชั่นล่าสุดอยู่แล้ว
      </div>
    );
  }

  if (status.state === 'checking') {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
        <RefreshCw className="h-4 w-4 animate-spin" />
        กำลังเช็คเวอร์ชั่นใหม่จาก GitHub…
      </div>
    );
  }

  if (status.state === 'available') {
    return (
      <div className="rounded-md bg-blue-500/10 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
          <Sparkles className="h-4 w-4" />
          พบเวอร์ชั่นใหม่ v{status.version} พร้อมอัพเดท
        </div>
        <Button onClick={onDownload} size="sm" className="w-full">
          <Download className="h-4 w-4 mr-2" />
          ดาวน์โหลด v{status.version}
        </Button>
      </div>
    );
  }

  if (status.state === 'downloading') {
    return (
      <div className="rounded-md bg-amber-500/10 p-3 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-200">
          <Download className="h-4 w-4" />
          กำลังดาวน์โหลดเวอร์ชั่นใหม่ — {status.percent ?? 0}%
        </div>
        <div className="h-2 w-full rounded-full bg-amber-500/20 overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${status.percent ?? 0}%` }}
          />
        </div>
      </div>
    );
  }

  if (status.state === 'ready') {
    return (
      <div className="rounded-md bg-emerald-500/10 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-200">
          <Sparkles className="h-4 w-4" />
          พร้อมติดตั้ง v{status.version} แล้ว
        </div>
        <Button onClick={onRestart} size="sm" className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Restart และติดตั้งเดี๋ยวนี้
        </Button>
      </div>
    );
  }

  if (status.state === 'error') {
    return (
      <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-medium">เช็คอัพเดทไม่สำเร็จ</div>
          <div className="text-xs opacity-80 mt-0.5">{status.message || 'ไม่ทราบสาเหตุ'}</div>
        </div>
      </div>
    );
  }

  return null;
}
