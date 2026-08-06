import { getVoiceClips } from './db';

/**
 * The parent's own voice, recorded once and used ahead of text-to-speech.
 *
 * Two reasons this matters more than it sounds. Android's Telugu, Tamil and
 * Kannada voices are poor or missing on cheap tablets, so TTS often gets the
 * word wrong. And a child who does not speak will still turn towards their
 * mother's voice long before a synthetic one.
 *
 * Clips are held in a plain map, refreshed when the child changes: speech has
 * to be instant, so it cannot wait on a database read mid-tap.
 */

let pack: Map<string, string> = new Map();
let loadedFor: string | null = null;

/** Re-reads a child's recordings. Safe to call often; it only reloads on change. */
export async function loadVoicePack(profileId: string, force = false) {
  if (!force && loadedFor === profileId) return;
  loadedFor = profileId;
  try {
    const clips = await getVoiceClips(profileId);
    pack = new Map(clips.map((c) => [c.wordId, c.audio]));
  } catch {
    // no recordings is the normal case, not a failure
    pack = new Map();
  }
}

export const recordedVoiceFor = (wordId: string): string | undefined => pack.get(wordId);

export const voicePackSize = () => pack.size;

/** Keeps the in-memory map in step after a recording is made or removed */
export function setRecordedVoice(wordId: string, audio: string | null) {
  if (audio) pack.set(wordId, audio);
  else pack.delete(wordId);
}
