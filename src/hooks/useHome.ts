import { useCallback, useEffect, useState } from 'react';
import { profileKey } from './useProfiles';

function load(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

/** Word ids the caregiver pinned to this child's 🏠 Home board */
export function useHome(profileId: string) {
  const key = profileKey('home', profileId);
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => load(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(pinnedIds));
    } catch {
      // best-effort persistence
    }
  }, [pinnedIds, key]);

  const addPin = useCallback((wordId: string) => {
    setPinnedIds((prev) => (prev.includes(wordId) ? prev : [...prev, wordId]));
  }, []);

  const removePin = useCallback((wordId: string) => {
    setPinnedIds((prev) => prev.filter((id) => id !== wordId));
  }, []);

  return { pinnedIds, addPin, removePin };
}
