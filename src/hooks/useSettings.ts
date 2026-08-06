import { useEffect, useState } from 'react';
import { profileKey } from './useProfiles';
import type { Settings } from '../types';

const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  motherTongue: 'hi',
  speakMotherTongue: false,
  ageMode: 2,
  speechRate: 0.85,
  showBothLanguages: true,
  speakOnTap: true,
  vibrateOnTap: true,
  roomyGrid: false,
  scanning: false,
  firstThenFirst: null,
  firstThenThen: null,
  videoLimitMins: 10,
  tileSize: 0,
  numberLimit: 10,
  sentenceStarters: false,
  enabledPackIds: [],
  hiddenCategoryIds: [],
  categoryOrder: [],
};

function loadSettings(key: string): Settings {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // fall through to defaults
  }
  return DEFAULT_SETTINGS;
}

export function useSettings(profileId: string) {
  const key = profileKey('settings', profileId);
  const [settings, setSettings] = useState<Settings>(() => loadSettings(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(settings));
    } catch {
      // storage may be unavailable; settings just won't persist
    }
  }, [settings, key]);

  const update = (patch: Partial<Settings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  return { settings, update };
}
