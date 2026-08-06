import { profileKey } from '../hooks/useProfiles';
import type { UsageMap } from './analytics';
import type { HistoryEntry, WordStat } from '../types';

/**
 * Reads another child's stored progress.
 *
 * The hooks are one-per-profile and can't be called in a loop, so the Progress
 * view reads siblings straight from storage. This is read-only by design —
 * nothing here writes, so switching children in the dashboard can never touch
 * a child's data.
 */

export interface ChildData {
  usage: UsageMap;
  stats: Record<string, WordStat>;
  history: HistoryEntry[];
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadChildData(profileId: string): ChildData {
  return {
    usage: read<UsageMap>(profileKey('usage', profileId), {}),
    stats: read<Record<string, WordStat>>(profileKey('mastery', profileId), {}),
    history: read<HistoryEntry[]>(profileKey('history', profileId), []),
  };
}
