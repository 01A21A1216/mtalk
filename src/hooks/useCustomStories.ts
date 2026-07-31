import { useEffect, useState } from 'react';
import { deleteStory, getAllStories, putStory } from '../services/db';
import type { CustomStory } from '../types';

/** Parent-made social stories (per profile), stored in IndexedDB */
export function useCustomStories(profileId: string) {
  const [stories, setStories] = useState<CustomStory[]>([]);

  useEffect(() => {
    getAllStories()
      .then((all) =>
        setStories(
          all
            .filter((s) => s.profileId === profileId)
            .sort((a, b) => a.createdAt - b.createdAt),
        ),
      )
      .catch(() => {
        // IndexedDB unavailable — stories stay empty
      });
  }, [profileId]);

  const addStory = async (story: Omit<CustomStory, 'id' | 'createdAt' | 'profileId'>) => {
    const full: CustomStory = {
      ...story,
      id: `cstory-${Date.now().toString(36)}`,
      createdAt: Date.now(),
      profileId,
    };
    await putStory(full);
    setStories((prev) => [...prev, full]);
  };

  const removeStory = async (id: string) => {
    await deleteStory(id);
    setStories((prev) => prev.filter((s) => s.id !== id));
  };

  return { stories, addStory, removeStory };
}
