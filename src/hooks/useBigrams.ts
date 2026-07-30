import { useCallback, useEffect, useState } from 'react';
import { profileKey } from './useProfiles';

/** Pseudo-word marking the start of a sentence */
export const SENTENCE_START = 'START';

/** prevWordId -> nextWordId -> count */
type BigramMap = Record<string, Record<string, number>>;

function load(key: string): BigramMap {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}');
  } catch {
    return {};
  }
}

/**
 * Learns which word the child usually taps after another, from their own
 * sentences. Powers the ✨ next-word suggestions above the board.
 */
export function useBigrams(profileId: string) {
  const key = profileKey('bigrams', profileId);
  const [bigrams, setBigrams] = useState<BigramMap>(() => load(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(bigrams));
    } catch {
      // best-effort persistence
    }
  }, [bigrams, key]);

  const recordPair = useCallback((prevId: string, nextId: string) => {
    setBigrams((prev) => ({
      ...prev,
      [prevId]: { ...prev[prevId], [nextId]: (prev[prevId]?.[nextId] ?? 0) + 1 },
    }));
  }, []);

  /** Most likely next word ids after `prevId`, needs at least 2 observations */
  const suggestNext = (prevId: string, n: number): string[] =>
    Object.entries(bigrams[prevId] ?? {})
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([id]) => id);

  return { recordPair, suggestNext };
}
