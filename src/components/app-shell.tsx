'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './sidebar';
import { RoundSelector } from './round-selector';
import { Button } from '@/components/ui/button';
import { useCurrentRound } from '@/hooks/use-current-round';
import { CurrentRoundProvider } from '@/contexts/current-round';
import { UpdateBanner } from './update-banner';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const roundState = useCurrentRound();

  return (
    <CurrentRoundProvider value={roundState}>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
            <div className="fixed inset-y-0 left-0 z-50 md:hidden">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </>
        )}

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <UpdateBanner />
          <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:px-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <span className="text-sm text-muted-foreground hidden md:inline">งวดปัจจุบัน:</span>
            </div>
            <RoundSelector
              rounds={roundState.rounds}
              currentRoundId={roundState.currentRoundId}
              onChange={roundState.changeRound}
              onRoundsChanged={roundState.refresh}
            />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </CurrentRoundProvider>
  );
}
