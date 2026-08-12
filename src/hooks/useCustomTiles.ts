import { useCallback, useEffect, useState } from 'react';
import { deleteTile, getAllTiles, putTile } from '../services/db';
import { FIRST_PROFILE_ID } from './useProfiles';
import type { CustomTile } from '../types';

/** Where a tile sits: its chosen place, or when it was made if never moved */
function placeOf(tile: CustomTile): number {
  return tile.order ?? tile.createdAt;
}

export function useCustomTiles(profileId: string) {
  const [tiles, setTiles] = useState<CustomTile[]>([]);

  useEffect(() => {
    getAllTiles()
      .then((all) =>
        setTiles(
          all
            // legacy tiles (no profileId) belong to the first profile
            .filter((t) => (t.profileId ?? FIRST_PROFILE_ID) === profileId)
            .sort((a, b) => placeOf(a) - placeOf(b)),
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

  /**
   * Moves a tile up or down within its own category.
   *
   * The tiles keep the numeric slots they already occupied and simply swap
   * which tile holds which — so a tile that has never been moved keeps sorting
   * by when it was made, and no tile ever jumps into another category's range.
   */
  const moveTile = useCallback(
    async (id: string, delta: number) => {
      const tile = tiles.find((t) => t.id === id);
      if (!tile) return;
      const family = tiles
        .filter((t) => (t.categoryId ?? '') === (tile.categoryId ?? ''))
        .sort((a, b) => placeOf(a) - placeOf(b));
      const from = family.findIndex((t) => t.id === id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= family.length) return;

      const slots = family.map(placeOf);
      const moved = [...family];
      moved.splice(to, 0, ...moved.splice(from, 1));
      const changed = moved
        .map((t, i) => ({ ...t, order: slots[i] }))
        .filter((t, i) => t.order !== placeOf(family[i]) || t.id !== family[i].id);

      await Promise.all(changed.map((t) => putTile(t)));
      setTiles((prev) => {
        const byId = new Map(changed.map((t) => [t.id, t]));
        return prev
          .map((t) => byId.get(t.id) ?? t)
          .sort((a, b) => placeOf(a) - placeOf(b));
      });
    },
    [tiles],
  );

  return { tiles, addTile, updateTile, removeTile, moveTile };
}
