import { useCallback, useEffect, useState } from 'react';
import { profileKey } from './useProfiles';
import type { HistoryEntry } from '../types';

const MAX_ENTRIES = 20;

function load(key: string): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

/** The last 20 sentences the child spoke, newest first */
export function useHistory(profileId: string) {
  const key = profileKey('history', profileId);
  const [history, setHistory] = useState<HistoryEntry[]>(() => load(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(history));
    } catch {
      // best-effort persistence
    }
  }, [history, key]);

  const addEntry = useCallback((wordIds: string[]) => {
    setHistory((prev) => [{ wordIds, ts: Date.now() }, ...prev].slice(0, MAX_ENTRIES));
  }, []);

  return { history, addEntry };
}
