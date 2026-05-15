'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

const STORAGE_KEY = 'last-seen-version';

/**
 * Show a one-time toast when the app's version is newer than what
 * the user last opened. Acts as a "What's New" banner after auto-update.
 */
export function WhatsNewToast() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.api?.update) return;

    (async () => {
      try {
        const status = await window.api.update.getStatus();
        const current = status?.version;
        if (!current) return;

        const lastSeen = localStorage.getItem(STORAGE_KEY);
        if (lastSeen !== current) {
          // First launch on this version → celebrate
          if (lastSeen) {
            // Upgrade from previous version
            toast.success(`อัพเดทเป็น v${current} แล้ว 🎉`, {
              description: 'ขอบคุณที่ใช้งาน Love Number — ระบบจัดการหวยของคุณ',
              duration: 6000,
              icon: <Sparkles className="h-4 w-4" />,
            });
          }
          localStorage.setItem(STORAGE_KEY, current);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  return null;
}
