import { useCallback, useEffect, useState } from 'react';
import { profileKey } from './useProfiles';

/**
 * What a stranger would need to know if this child were found alone.
 *
 * A non-verbal child separated from their family cannot say their own name,
 * cannot recite a phone number, and cannot explain that they use a tablet to
 * talk. This is that information in one place, for the lock screen of a bad
 * afternoon — and, printed, for the schoolbag.
 *
 * It stays on the tablet. It is never published to the online user directory
 * and never leaves in a backup the family did not ask for: a child's address
 * and their parents' phone numbers are the last thing that should be synced
 * anywhere by default.
 */
export interface AboutMe {
  /** shown to whoever is helping, in their words */
  fullName: string;
  callName: string;
  parentName: string;
  parentPhone: string;
  otherPhone: string;
  address: string;
  school: string;
  /** allergies, conditions, medicines — anything a doctor should know first */
  medical: string;
  /** how this child communicates, and what helps */
  communication: string;
  calming: string;
}

export const EMPTY_ABOUT: AboutMe = {
  fullName: '',
  callName: '',
  parentName: '',
  parentPhone: '',
  otherPhone: '',
  address: '',
  school: '',
  medical: '',
  communication: '',
  calming: '',
};

function load(key: string): AboutMe {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...EMPTY_ABOUT, ...JSON.parse(raw) };
  } catch {
    // fall through to a blank card
  }
  return EMPTY_ABOUT;
}

/** True once there is enough here to be worth showing or printing */
export function hasAbout(about: AboutMe): boolean {
  return Boolean(about.callName || about.fullName || about.parentPhone);
}

export function useAboutMe(profileId: string) {
  const key = profileKey('about', profileId);
  const [about, setAbout] = useState<AboutMe>(() => load(key));

  useEffect(() => {
    setAbout(load(key));
  }, [key]);

  const update = useCallback(
    (patch: Partial<AboutMe>) => {
      setAbout((prev) => {
        const next = { ...prev, ...patch };
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // storage full or blocked; the card just will not persist
        }
        return next;
      });
    },
    [key],
  );

  return { about, update };
}
