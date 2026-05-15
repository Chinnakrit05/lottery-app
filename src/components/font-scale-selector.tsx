'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Type } from 'lucide-react';
import { useUIPreferences, FONT_SCALES, FONT_SCALE_LABELS, type FontScale } from '@/contexts/ui-preferences';
import { cn } from '@/lib/utils';

export function FontScaleSelector() {
  const { fontScale, setFontScale } = useUIPreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          ขนาดตัวอักษร
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          ปรับขนาดฟอนต์ทั้งระบบ — ไอคอน ปุ่ม และระยะห่างจะ scale ตามอัตโนมัติ
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {FONT_SCALES.map((s) => {
            const isActive = fontScale === s;
            const meta = FONT_SCALE_LABELS[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFontScale(s)}
                className={cn(
                  'group relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 py-4',
                  'transition-bounce select-none active:scale-[0.96]',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent hover:shadow-md',
                )}
              >
                <PreviewText scale={s} active={isActive} />
                <span className="text-sm font-semibold mt-1">{meta.label}</span>
                <span className={cn('text-xs', isActive ? 'opacity-80' : 'text-muted-foreground')}>
                  {meta.desc} · {meta.px}
                </span>
                {isActive && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary-foreground animate-pop-in" />
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground border">
          💡 ปัจจุบัน: <b>{FONT_SCALE_LABELS[fontScale].label}</b> ({FONT_SCALE_LABELS[fontScale].px}) —
          การตั้งค่านี้จะถูกบันทึก และใช้กับทุกหน้าทันที
        </div>
      </CardContent>
    </Card>
  );
}

/** Mini preview of the chosen scale — uses fixed pixel sizes that don't depend on context */
function PreviewText({ scale, active }: { scale: FontScale; active: boolean }) {
  const pxMap: Record<FontScale, number> = { sm: 14, md: 18, lg: 22, xl: 26 };
  return (
    <div
      className={cn(
        'flex items-center justify-center font-bold leading-none mb-1',
        active ? 'text-primary-foreground' : 'text-foreground',
      )}
      style={{ fontSize: pxMap[scale] }}
    >
      Aa
    </div>
  );
}
