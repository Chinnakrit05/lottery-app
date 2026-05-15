'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type FontScale = 'sm' | 'md' | 'lg' | 'xl';

interface UIPreferencesValue {
  fontScale: FontScale;
  setFontScale: (s: FontScale) => void;
}

const Ctx = createContext<UIPreferencesValue | null>(null);

const STORAGE_KEY = 'ui-font-scale';
const DEFAULT_SCALE: FontScale = 'md';

function applyToHtml(scale: FontScale) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-font-scale', scale);
}

export function UIPreferencesProvider({ children }: { children: ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>(DEFAULT_SCALE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as FontScale | null;
      if (saved && ['sm', 'md', 'lg', 'xl'].includes(saved)) {
        setFontScaleState(saved);
        applyToHtml(saved);
      } else {
        applyToHtml(DEFAULT_SCALE);
      }
    } catch {
      applyToHtml(DEFAULT_SCALE);
    }
  }, []);

  const setFontScale = useCallback((s: FontScale) => {
    setFontScaleState(s);
    try {
      localStorage.setItem(STORAGE_KEY, s);
    } catch {
      // ignore
    }
    applyToHtml(s);
  }, []);

  return <Ctx.Provider value={{ fontScale, setFontScale }}>{children}</Ctx.Provider>;
}

export function useUIPreferences(): UIPreferencesValue {
  const v = useContext(Ctx);
  if (!v) {
    // Fallback — when called outside provider, return defaults
    return { fontScale: DEFAULT_SCALE, setFontScale: () => {} };
  }
  return v;
}

export const FONT_SCALE_LABELS: Record<FontScale, { label: string; desc: string; px: string }> = {
  sm: { label: 'เล็ก',     desc: '87.5%', px: '14px' },
  md: { label: 'ปกติ',     desc: '100%',  px: '16px' },
  lg: { label: 'ใหญ่',     desc: '112.5%', px: '18px' },
  xl: { label: 'ใหญ่มาก',   desc: '125%',  px: '20px' },
};

export const FONT_SCALES: FontScale[] = ['sm', 'md', 'lg', 'xl'];
