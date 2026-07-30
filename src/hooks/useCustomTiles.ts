import { useEffect, useState } from 'react';
import { deleteTile, getAllTiles, putTile } from '../services/db';
import { FIRST_PROFILE_ID } from './useProfiles';
import type { CustomTile } from '../types';

export function useCustomTiles(profileId: string) {
  const [tiles, setTiles] = useState<CustomTile[]>([]);

  useEffect(() => {
    getAllTiles()
      .then((all) =>
        setTiles(
          all
            // legacy tiles (no profileId) belong to the first profile
            .filter((t) => (t.profileId ?? FIRST_PROFILE_ID) === profileId)
            .sort((a, b) => a.createdAt - b.createdAt),
        ),
      )
      .catch(() => {
        // IndexedDB unavailable (rare) — custom tiles simply stay empty
      });
  }, [profileId]);

  const addTile = async (tile: Omit<CustomTile, 'id' | 'createdAt' | 'profileId'>) => {
    const full: CustomTile = {
      ...tile,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
      profileId,
    };
    await putTile(full);
    setTiles((prev) => [...prev, full]);
  };

  const updateTile = async (tile: CustomTile) => {
    await putTile(tile);
    setTiles((prev) => prev.map((t) => (t.id === tile.id ? tile : t)));
  };

  const removeTile = async (id: string) => {
    await deleteTile(id);
    setTiles((prev) => prev.filter((t) => t.id !== id));
  };

  return { tiles, addTile, updateTile, removeTile };
}
