import { useCallback, useEffect, useState } from 'react';
import { profileKey } from './useProfiles';

/**
 * What a child has done in the thinking games, kept per profile.
 *
 * Deliberately thin: rounds finished and the hardest level reached. There is
 * no score, no streak and no accuracy — a child who needs twenty taps to find
 * the picture has still found the picture, and nothing here should ever be
 * readable as a mark out of ten.
 */
export interface GameRecord {
  rounds: number;
  /** hardest level reached: tiles on screen for Find it, pairs for Pairs */
  best: number;
  lastPlayed: number;
}

export type GameStats = Record<string, GameRecord>;

function load(key: string): GameStats {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}');
  } catch {
    return {};
  }
}

export function useGameStats(profileId: string) {
  const key = profileKey('games', profileId);
  const [stats, setStats] = useState<GameStats>(() => load(key));

  useEffect(() => {
    setStats(load(key));
  }, [key]);

  const recordRound = useCallback(
    (game: string, level: number) => {
      setStats((prev) => {
        const before = prev[game];
        const next: GameStats = {
          ...prev,
          [game]: {
            rounds: (before?.rounds ?? 0) + 1,
            best: Math.max(before?.best ?? 0, level),
            lastPlayed: Date.now(),
          },
        };
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // a game that cannot be recorded is still a game worth playing
        }
        return next;
      });
    },
    [key],
  );

  return { gameStats: stats, recordRound };
}
