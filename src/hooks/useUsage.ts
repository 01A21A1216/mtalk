import { useCallback, useEffect, useState } from 'react';
import { profileKey } from './useProfiles';
const DAY_MS = 24 * 60 * 60 * 1000;
const KEEP_DAYS = 28;

interface WordUsage {
  total: number;
  /** epoch day the word was first ever tapped */
  firstDay: number;
  /** taps per epoch day, pruned to the last KEEP_DAYS */
  byDay: Record<string, number>;
}

type UsageMap = Record<string, WordUsage>;

const today = () => Math.floor(Date.now() / DAY_MS);

function load(key: string): UsageMap {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}');
  } catch {
    return {};
  }
}

function prune(usage: WordUsage): WordUsage {
  const cutoff = today() - KEEP_DAYS;
  const byDay: Record<string, number> = {};
  for (const [day, count] of Object.entries(usage.byDay)) {
    if (Number(day) >= cutoff) byDay[day] = count;
  }
  return { ...usage, byDay };
}

export function useUsage(profileId: string) {
  const key = profileKey('usage', profileId);
  const [usage, setUsage] = useState<UsageMap>(() => load(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(usage));
    } catch {
      // best-effort persistence
    }
  }, [usage, key]);

  const recordUse = useCallback((wordId: string) => {
    const day = String(today());
    setUsage((prev) => {
      const u = prev[wordId] ?? { total: 0, firstDay: today(), byDay: {} };
      return {
        ...prev,
        [wordId]: prune({
          ...u,
          total: u.total + 1,
          byDay: { ...u.byDay, [day]: (u.byDay[day] ?? 0) + 1 },
        }),
      };
    });
  }, []);

  /** Word ids ranked by total taps, most-used first */
  const topWordIds = (n: number, minCount = 1): string[] =>
    Object.entries(usage)
      .filter(([, u]) => u.total >= minCount)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, n)
      .map(([id]) => id);

  const countSince = (u: WordUsage, sinceDay: number) =>
    Object.entries(u.byDay).reduce(
      (sum, [day, count]) => (Number(day) >= sinceDay ? sum + count : sum),
      0,
    );

  const weekAgo = today() - 7;
  const usedThisWeek = Object.values(usage).filter((u) => countSince(u, weekAgo) > 0).length;
  const newThisWeek = Object.values(usage).filter((u) => u.firstDay >= weekAgo).length;

  return { usage, recordUse, topWordIds, usedThisWeek, newThisWeek };
}
