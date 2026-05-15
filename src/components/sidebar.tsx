'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PencilLine, Search, BarChart3, Trophy, History, Users, Database, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

function AppVersionLabel() {
  const [version, setVersion] = useState<string>('');
  useEffect(() => {
    if (typeof window === 'undefined' || !window.api?.update) return;
    // Retry once after a short delay in case IPC handlers aren't registered yet
    const tryFetch = async (attempt = 0): Promise<void> => {
      try {
        const s = await window.api.update.getStatus();
        if (s?.version) setVersion(s.version);
      } catch {
        if (attempt < 3) {
          setTimeout(() => tryFetch(attempt + 1), 500);
        }
      }
    };
    tryFetch();
  }, []);
  return (
    <span className="text-xs text-muted-foreground">
      Offline{version ? ` · v${version}` : ''}
    </span>
  );
}

const NAV = [
  { href: '/sales', label: 'บันทึกการขาย', icon: PencilLine },
  { href: '/search', label: 'ค้นหาเลข', icon: Search },
  { href: '/report', label: 'รายงานยอด', icon: BarChart3 },
  { href: '/result', label: 'ตรวจรางวัล', icon: Trophy },
  { href: '/history', label: 'ประวัติ', icon: History },
  { href: '/customers', label: 'ลูกค้า', icon: Users },
  { href: '/backup', label: 'สำรองข้อมูล', icon: Database },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-72 flex-col border-r bg-card/95 backdrop-blur-sm">
      {/* Brand header */}
      <div className="flex items-center gap-3 border-b px-6 py-5 bg-gradient-to-br from-primary/5 to-transparent">
        <span className="text-4xl animate-pop-in">🐱</span>
        <div>
          <div className="font-bold text-base leading-tight text-gradient">LotteryApp</div>
          <div className="text-xs text-muted-foreground mt-0.5">ระบบจัดการหวย</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item, idx) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              style={{ animationDelay: `${idx * 30}ms` }}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium animate-fade-in',
                'transition-smooth select-none',
                active
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground active:scale-[0.98]',
              )}
            >
              <Icon className={cn(
                'h-5 w-5 transition-transform duration-200',
                active ? 'scale-110' : 'group-hover:scale-110',
              )} />
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pop-in" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4 flex items-center justify-between bg-gradient-to-t from-muted/30 to-transparent">
        <AppVersionLabel />
        <ThemeToggle />
      </div>
    </aside>
  );
}
