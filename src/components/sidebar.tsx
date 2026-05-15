'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PencilLine, Search, BarChart3, Trophy, History, Users, Database, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

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
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex items-center gap-2 border-b px-6 py-5">
        <span className="text-2xl">🎰</span>
        <div>
          <div className="font-semibold leading-tight">LotteryApp</div>
          <div className="text-xs text-muted-foreground">ระบบจัดการหวย</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Offline · v1.0.0</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
