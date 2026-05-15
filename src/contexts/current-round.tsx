'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Round } from '@/types/database';

interface CurrentRoundValue {
  rounds: Round[];
  currentRound: Round | null;
  currentRoundId: number | null;
  changeRound: (id: number) => void;
  refresh: () => Promise<void> | void;
  loading: boolean;
}

const Ctx = createContext<CurrentRoundValue | null>(null);

export function CurrentRoundProvider({ value, children }: { value: CurrentRoundValue; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrentRoundCtx(): CurrentRoundValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCurrentRoundCtx must be used inside CurrentRoundProvider');
  return v;
}
