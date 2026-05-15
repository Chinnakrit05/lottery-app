'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, RefreshCw, CheckCircle2, Sparkles, X, Settings } from 'lucide-react';
import Link from 'next/link';
import type { UpdateStatus } from '@/types/electron-api';

const DISMISSED_KEY = 'update-banner-dismissed-version';

function isElectronWithUpdate() {
  return typeof window !== 'undefined' && !!window.api?.update;
}

export function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!isElectronWithUpdate()) return;
    let unsub: (() => void) | undefined;
    setDismissedVersion(localStorage.getItem(DISMISSED_KEY));
    (async () => {
      try {
        const initial = await window.api.update.getStatus();
        setStatus(initial);
      } catch {
        // ignore
      }
      unsub = window.api.update.onStatus((s) => {
        setStatus(s);
        // Toast on key transitions — non-intrusive
        if (s.state === 'available') {
          toast.message(`พบเวอร์ชั่นใหม่: v${s.version}`, {
            description: 'ไปที่หน้า "ตั้งค่า" เพื่ออัพเดท',
            icon: <Sparkles className="h-4 w-4" />,
            duration: 6000,
          });
        } else if (s.state === 'ready') {
          toast.success(`พร้อมติดตั้ง v${s.version}`, {
            description: 'กดปุ่ม "Restart + ติดตั้ง" ในแถบด้านบน',
            duration: 10000,
          });
        }
      });
    })();
    return () => unsub?.();
  }, []);

  const handleDismiss = () => {
    if (status.version) {
      localStorage.setItem(DISMISSED_KEY, status.version);
      setDismissedVersion(status.version);
    }
  };

  // Don't show if user dismissed this version (only applies to 'available' state)
  const isDismissed = status.state === 'available' && dismissedVersion === status.version;

  // Banner shows for available / downloading / ready
  if (status.state === 'available' && !isDismissed) {
    return (
      <div className="flex items-center gap-3 border-b bg-blue-500/10 px-4 py-2 text-xs">
        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-300" />
        <span className="font-medium text-blue-900 dark:text-blue-200">
          พบเวอร์ชั่นใหม่ v{status.version}
        </span>
        <span className="text-muted-foreground hidden md:inline">
          — ไปหน้าตั้งค่าเพื่อดาวน์โหลด
        </span>
        <Link href="/settings" className="ml-auto">
          <Button size="sm" variant="outline" className="h-7">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            ไปหน้าตั้งค่า
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleDismiss}
          title="ซ่อนการแจ้งเตือนนี้"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  if (status.state === 'downloading') {
    return (
      <div className="flex items-center gap-3 border-b bg-amber-500/10 px-4 py-2 text-xs text-amber-900 dark:text-amber-200">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span>กำลังดาวน์โหลด v{status.version} — {status.percent ?? 0}%</span>
        <div className="h-1.5 flex-1 max-w-[180px] rounded-full bg-amber-500/20 overflow-hidden">
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

  return null;
}
