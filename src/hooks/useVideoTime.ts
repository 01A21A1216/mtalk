import { useCallback, useEffect, useState } from 'react';
import { profileKey } from './useProfiles';

const DAY_MS = 24 * 60 * 60 * 1000;
const today = () => Math.floor(Date.now() / DAY_MS);

interface VideoTime {
  day: number;
  seconds: number;
}

function load(key: string): VideoTime {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null') as VideoTime | null;
    // a new day starts with a fresh budget automatically
    if (parsed && parsed.day === today()) return parsed;
  } catch {
    // fall through
  }
  return { day: today(), seconds: 0 };
}

/** Tracks how many seconds of video were watched today (per profile) */
export function useVideoTime(profileId: string, limitMins: number) {
  const key = profileKey('videotime', profileId);
  const [time, setTime] = useState<VideoTime>(() => load(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(time));
    } catch {
      // best-effort persistence
    }
  }, [time, key]);

  /** Called once per second while a video plays */
  const addSecond = useCallback(() => {
    setTime((prev) =>
      prev.day === today()
        ? { ...prev, seconds: prev.seconds + 1 }
        : { day: today(), seconds: 1 },
    );
  }, []);

  /** Parent reset from settings — restores today's full budget */
  const resetToday = useCallback(() => {
    setTime({ day: today(), seconds: 0 });
  }, []);

  const usedSeconds = time.day === today() ? time.seconds : 0;
  const remainingSeconds = Math.max(0, limitMins * 60 - usedSeconds);

  return { remainingSeconds, usedSeconds, addSecond, resetToday };
}
