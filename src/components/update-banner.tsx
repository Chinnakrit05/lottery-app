'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { UpdateStatus } from '@/types/electron-api';

function isElectronWithUpdate() {
  return typeof window !== 'undefined' && !!window.api?.update;
}

export function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });

  useEffect(() => {
    if (!isElectronWithUpdate()) return;
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const initial = await window.api.update.getStatus();
        setStatus(initial);
      } catch {
        // Handler not registered yet — fine, we still receive future events
      }
      unsub = window.api.update.onStatus((s) => {
        setStatus(s);
        // Friendly toast on key transitions
        if (s.state === 'available') {
          toast.message(`พบเวอร์ชั่นใหม่: v${s.version}`, {
            description: 'กำลังดาวน์โหลด…',
          });
        } else if (s.state === 'ready') {
          toast.success(`พร้อมติดตั้ง v${s.version}`, {
            description: 'กดปุ่ม "Restart + ติดตั้ง" ด้านล่างเพื่ออัพเดท',
            duration: 10000,
          });
        } else if (s.state === 'error') {
          // Suppress error toasts in normal use to avoid noise (e.g., when offline)
          console.warn('[update] error:', s.message);
        }
      });
    })();
    return () => unsub?.();
  }, []);

  // Only show banner on "ready" or "downloading" states
  if (status.state !== 'ready' && status.state !== 'downloading') return null;

  if (status.state === 'downloading') {
    return (
      <div className="flex items-center gap-3 border-b bg-amber-500/10 px-4 py-2 text-xs text-amber-900 dark:text-amber-200">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span>กำลังดาวน์โหลดเวอร์ชั่นใหม่ — {status.percent ?? 0}%</span>
        <div className="h-1.5 flex-1 max-w-[180px] rounded-full bg-amber-500/20 overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${status.percent ?? 0}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-b bg-emerald-500/10 px-4 py-2 text-xs">
      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
      <span className="font-medium text-emerald-900 dark:text-emerald-200">
        พร้อมติดตั้งเวอร์ชั่นใหม่ v{status.version}
      </span>
      <span className="text-muted-foreground hidden md:inline">
        — กด Restart เพื่ออัพเดท
      </span>
      <Button
        size="sm"
        variant="default"
        className="ml-auto h-7"
        onClick={() => window.api.update.restartAndInstall()}
      >
        <Download className="h-3.5 w-3.5 mr-1.5" />
        Restart + ติดตั้ง
      </Button>
    </div>
  );
}
