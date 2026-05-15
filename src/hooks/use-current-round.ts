'use client';

import { useCallback, useEffect, useState } from 'react';
import { dbClient, isElectron } from '@/lib/db-client';
import type { Round } from '@/types/database';

const STORAGE_KEY = 'currentRoundId';

export function useCurrentRound() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRoundId, setCurrentRoundId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isElectron()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await dbClient.rounds.list();
    setRounds(list);
    const saved = Number(localStorage.getItem(STORAGE_KEY)) || null;
    const exists = list.find((r) => r.id === saved);
    if (exists) {
      setCurrentRoundId(exists.id);
    } else if (list.length > 0) {
      setCurrentRoundId(list[0].id);
      localStorage.setItem(STORAGE_KEY, String(list[0].id));
    } else {
      setCurrentRoundId(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const changeRound = useCallback((id: number) => {
    setCurrentRoundId(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  const currentRound = rounds.find((r) => r.id === currentRoundId) || null;

  return { rounds, currentRound, currentRoundId, changeRound, refresh, loading };
}
