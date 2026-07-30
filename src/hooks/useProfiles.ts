import { useCallback, useEffect, useState } from 'react';
import type { Profile } from '../types';

const STORAGE_KEY = 'mtalk-profiles';
export const FIRST_PROFILE_ID = 'p1';

/** Per-profile localStorage bases that get namespaced as `mtalk-<base>:<pid>` */
const PROFILE_BASES = ['settings', 'mastery', 'usage', 'history', 'bigrams', 'cats', 'home'];

export const profileKey = (base: string, profileId: string) =>
  `mtalk-${base}:${profileId}`;

interface ProfileStore {
  list: Profile[];
  activeId: string;
}

function load(): ProfileStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProfileStore;
      if (parsed.list?.length) return parsed;
    }
  } catch {
    // fall through to first-run setup
  }
  // First run: create the initial profile and adopt any pre-profile data
  const store: ProfileStore = {
    list: [{ id: FIRST_PROFILE_ID, name: 'My Kid', emoji: '🧒' }],
    activeId: FIRST_PROFILE_ID,
  };
  for (const base of PROFILE_BASES) {
    const legacy = localStorage.getItem(`mtalk-${base}`);
    const target = profileKey(base, FIRST_PROFILE_ID);
    if (legacy != null && localStorage.getItem(target) == null) {
      localStorage.setItem(target, legacy);
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  return store;
}

const AVATARS = ['🧒', '👧', '👦', '🐯', '🐼', '🦄', '🚀', '🌟', '🦁', '🐥'];

export function useProfiles() {
  const [store, setStore] = useState<ProfileStore>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // best-effort persistence
    }
  }, [store]);

  const active =
    store.list.find((p) => p.id === store.activeId) ?? store.list[0];

  const setActive = useCallback((id: string) => {
    setStore((prev) => ({ ...prev, activeId: id }));
  }, []);

  const addProfile = useCallback((name: string) => {
    const profile: Profile = {
      id: `p${Date.now().toString(36)}`,
      name: name.trim() || 'Kid',
      emoji: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    };
    setStore((prev) => ({ list: [...prev.list, profile], activeId: profile.id }));
  }, []);

  const removeProfile = useCallback((id: string) => {
    setStore((prev) => {
      if (prev.list.length <= 1) return prev; // always keep one profile
      const list = prev.list.filter((p) => p.id !== id);
      for (const base of PROFILE_BASES) {
        localStorage.removeItem(profileKey(base, id));
      }
      return { list, activeId: prev.activeId === id ? list[0].id : prev.activeId };
    });
  }, []);

  return { profiles: store.list, active, setActive, addProfile, removeProfile };
}
