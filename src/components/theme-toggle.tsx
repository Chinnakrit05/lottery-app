'use client';

import { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Sunrise, BookOpen, Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const THEMES = [
  { key: 'light',  label: 'Light',         desc: 'สว่างคูล',           icon: Sun,      colors: ['#ffffff', '#3a3aff', '#f1f5f9'] },
  { key: 'dark',   label: 'Dark',          desc: 'มืดคูล',             icon: Moon,     colors: ['#0f1424', '#6b7df5', '#1a2440'] },
  { key: 'warm',   label: 'Warm Cream',    desc: 'อบอุ่น นุ่มสบายตา',     icon: Sunrise,  colors: ['#f6f3ee', '#c08755', '#ebe3d8'] },
  { key: 'sepia',  label: 'Sepia Paper',   desc: 'กระดาษเก่า อ่านสบาย',   icon: BookOpen, colors: ['#ebe1cc', '#9c6a3f', '#d9cab5'] },
  { key: 'system', label: 'System',        desc: 'ตามเครื่อง',          icon: Monitor,  colors: ['#cccccc', '#666666', '#999999'] },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!mounted) {
    return <Button variant="ghost" size="icon" disabled aria-hidden />;
  }

  const current = THEMES.find((t) => t.key === theme) || THEMES[4];
  const CurrentIcon = current.icon;

  return (
    <div className="relative" ref={wrapRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        title={`Theme: ${current.label}`}
        aria-label="เปลี่ยน Theme"
      >
        <CurrentIcon className="h-4 w-4" />
      </Button>

      {open && (
        <div
          className={cn(
            'absolute right-0 bottom-full mb-2 z-50 w-64 rounded-xl border bg-popover p-1.5 shadow-soft-lg',
            'animate-pop-in',
          )}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b mb-1">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">เลือก Theme</span>
          </div>
          {THEMES.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTheme(t.key);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left',
                  'transition-smooth select-none',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-accent',
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-tight">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                </div>
                {/* color swatches */}
                <div className="flex gap-0.5">
                  {t.colors.map((c, i) => (
                    <span
                      key={i}
                      className="h-3 w-3 rounded-full border"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                {isActive && <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
