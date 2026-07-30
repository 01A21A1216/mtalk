import { useCallback, useEffect, useState } from 'react';
import { profileKey } from './useProfiles';
import type { CustomCategory } from '../types';

const PALETTE: [string, string][] = [
  ['#E0F2F1', '#00695C'],
  ['#FFF3E0', '#E65100'],
  ['#EDE7F6', '#4527A0'],
  ['#FCE4EC', '#AD1457'],
  ['#F1F8E9', '#33691E'],
  ['#E1F5FE', '#01579B'],
];

function load(key: string): CustomCategory[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

/** Parent-created categories for organising custom tiles (per profile) */
export function useCustomCategories(profileId: string) {
  const key = profileKey('cats', profileId);
  const [categories, setCategories] = useState<CustomCategory[]>(() => load(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(categories));
    } catch {
      // best-effort persistence
    }
  }, [categories, key]);

  const addCategory = useCallback((name: string, emoji: string) => {
    setCategories((prev) => {
      const [color, colorDark] = PALETTE[prev.length % PALETTE.length];
      return [
        ...prev,
        {
          id: `cc-${Date.now().toString(36)}`,
          name: name.trim() || 'New category',
          emoji: emoji.trim() || '📁',
          color,
          colorDark,
        },
      ];
    });
  }, []);

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categories, addCategory, removeCategory };
}
