import { IMAGE_GEN_URL } from '../config';

/**
 * Ways to get a picture onto a tile, beyond the camera roll.
 *
 * A real photo of the child's own bottle beats any stock image — so the
 * camera stays the first option in the editor. Search and AI are there for
 * the things you can't photograph: "aeroplane", "doctor", "angry".
 */

/** Everything is squared off and shrunk so tiles stay small in IndexedDB */
const TILE_PX = 320;

export interface ImageResult {
  id: string;
  title: string;
  thumbnail: string;
  license: string;
  source: string;
}

/**
 * Openverse (the Creative Commons search index) — no API key, no account, and
 * its thumbnail endpoint sends CORS headers, so a picked image can be drawn to
 * a canvas and stored as a data URL. Results are CC-licensed; for a private
 * family board that is fine, but the licence is kept on screen so a parent
 * publishing anything knows what they have.
 */
export async function searchImages(query: string): Promise<ImageResult[]> {
  const url = new URL('https://api.openverse.org/v1/images/');
  url.searchParams.set('q', query);
  url.searchParams.set('page_size', '12');
  url.searchParams.set('mature', 'false');

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Image search is not available right now.');
  const data = (await res.json()) as {
    results?: {
      id: string;
      title?: string;
      thumbnail?: string;
      license?: string;
      source?: string;
    }[];
  };
  return (data.results ?? [])
    .filter((r) => r.thumbnail)
    .map((r) => ({
      id: r.id,
      title: r.title ?? 'Untitled',
      thumbnail: r.thumbnail!,
      license: (r.license ?? '').toUpperCase(),
      source: r.source ?? '',
    }));
}

/** Draws any fetchable image into a square tile-sized JPEG data URL */
export async function toTileDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  if (!res.ok) throw new Error('Could not download that picture.');
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);

  // Centre-crop to a square so tiles line up on the board
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = TILE_PX;
  canvas.height = TILE_PX;
  canvas
    .getContext('2d')!
    .drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      TILE_PX,
      TILE_PX,
    );
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}

export const imageGenAvailable = () => !!IMAGE_GEN_URL;

/**
 * Asks your own endpoint for a picture. Deliberately *not* a direct call to
 * an image-generation provider: a key shipped inside an APK can be extracted
 * and spent by anyone, so the app talks to a proxy you control (a Cloud
 * Function) which holds the key server-side.
 *
 * Expected reply: { image: "data:image/..." } or { url: "https://..." }.
 */
export async function generateImage(name: string, category?: string): Promise<string> {
  if (!IMAGE_GEN_URL) throw new Error('Picture generation is not set up yet.');
  const prompt = [
    `A simple, friendly picture of "${name}"`,
    category ? `in the context of ${category}` : '',
    'flat illustration, bold clear shapes, plain white background,',
    'no text, no words, centred, suitable for a child communication card',
  ]
    .filter(Boolean)
    .join(' ');

  const res = await fetch(IMAGE_GEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, name, category }),
  });
  if (!res.ok) throw new Error('Could not make a picture. Please try again.');
  const data = (await res.json()) as { image?: string; url?: string };
  const src = data.image ?? data.url;
  if (!src) throw new Error('That picture service sent nothing back.');
  return src.startsWith('data:') ? src : toTileDataUrl(src);
}
