import { useCallback, useEffect, useState } from 'react';
import { profileKey } from './useProfiles';
import type { VideoTile } from '../types';

/** Pull the 11-char video id out of any common YouTube URL shape */
export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match ? match[1] : null;
}

export function videoThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function load(key: string): VideoTile[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

/** Parent-curated YouTube reward videos (per profile) */
export function useVideos(profileId: string) {
  const key = profileKey('videos', profileId);
  const [videos, setVideos] = useState<VideoTile[]>(() => load(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(videos));
    } catch {
      // best-effort persistence
    }
  }, [videos, key]);

  /** Returns false when the URL is not a recognisable YouTube link */
  const addVideo = useCallback((url: string, title: string): boolean => {
    const videoId = extractYouTubeId(url.trim());
    if (!videoId) return false;
    setVideos((prev) => [
      ...prev,
      {
        id: `video-${Date.now().toString(36)}`,
        title: title.trim() || 'Video',
        videoId,
        createdAt: Date.now(),
      },
    ]);
    return true;
  }, []);

  const removeVideo = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return { videos, addVideo, removeVideo };
}
