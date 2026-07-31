import { useCallback, useEffect, useState } from 'react';
import { profileKey } from './useProfiles';
import type { ScheduleStep } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const today = () => Math.floor(Date.now() / DAY_MS);

interface DoneState {
  day: number;
  ids: string[];
}

function loadSteps(key: string): ScheduleStep[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

function loadDone(key: string): DoneState {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null') as DoneState | null;
    // ticks clear themselves overnight so every morning starts fresh
    if (parsed && parsed.day === today()) return parsed;
  } catch {
    // fall through
  }
  return { day: today(), ids: [] };
}

/** The child's full-day routine (wake → school → play → sleep) with daily ticks */
export function useSchedule(profileId: string) {
  const stepsKey = profileKey('schedule', profileId);
  const doneKey = profileKey('scheduledone', profileId);
  const [steps, setSteps] = useState<ScheduleStep[]>(() => loadSteps(stepsKey));
  const [done, setDone] = useState<DoneState>(() => loadDone(doneKey));

  useEffect(() => {
    try {
      localStorage.setItem(stepsKey, JSON.stringify(steps));
    } catch {
      // best-effort persistence
    }
  }, [steps, stepsKey]);

  useEffect(() => {
    try {
      localStorage.setItem(doneKey, JSON.stringify(done));
    } catch {
      // best-effort persistence
    }
  }, [done, doneKey]);

  const addStep = useCallback((wordId: string, time?: string) => {
    setSteps((prev) => [
      ...prev,
      { id: `st-${Date.now().toString(36)}`, wordId, time: time?.trim() || undefined },
    ]);
  }, []);

  const removeStep = useCallback((id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    setDone((prev) => ({ ...prev, ids: prev.ids.filter((x) => x !== id) }));
  }, []);

  const moveStep = useCallback((id: string, delta: number) => {
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const toggleDone = useCallback((id: string) => {
    setDone((prev) => {
      const base = prev.day === today() ? prev : { day: today(), ids: [] };
      return base.ids.includes(id)
        ? { ...base, ids: base.ids.filter((x) => x !== id) }
        : { ...base, ids: [...base.ids, id] };
    });
  }, []);

  const resetDay = useCallback(() => setDone({ day: today(), ids: [] }), []);

  const doneIds = done.day === today() ? done.ids : [];
  /** first step not yet ticked — the "now" step */
  const currentIndex = steps.findIndex((s) => !doneIds.includes(s.id));

  return { steps, doneIds, currentIndex, addStep, removeStep, moveStep, toggleDone, resetDay };
}
