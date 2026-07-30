import { useCallback, useEffect, useState } from 'react';
import { profileKey } from './useProfiles';
import type { WordStat } from '../types';

export const MASTERY_STREAK = 3;

type MasteryMap = Record<string, WordStat>;

function load(key: string): MasteryMap {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}');
  } catch {
    return {};
  }
}

export function isMastered(stat: WordStat | undefined): boolean {
  return (stat?.streak ?? 0) >= MASTERY_STREAK;
}

export function useMastery(profileId: string) {
  const key = profileKey('mastery', profileId);
  const [stats, setStats] = useState<MasteryMap>(() => load(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(stats));
    } catch {
      // best-effort persistence
    }
  }, [stats, key]);

  /** Record one quiz answer. `firstTry` = correct without any wrong taps first. */
  const record = useCallback((wordId: string, firstTry: boolean) => {
    setStats((prev) => {
      const s = prev[wordId] ?? { attempts: 0, correct: 0, streak: 0 };
      return {
        ...prev,
        [wordId]: {
          attempts: s.attempts + 1,
          correct: s.correct + (firstTry ? 1 : 0),
          streak: firstTry ? s.streak + 1 : 0,
        },
      };
    });
  }, []);

  const masteredCount = Object.values(stats).filter(isMastered).length;
  const practicedCount = Object.keys(stats).length;

  return { stats, record, masteredCount, practicedCount };
}
