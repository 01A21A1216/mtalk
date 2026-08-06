/**
 * Open Board Format (OBF / OBZ) — https://www.openboardformat.org
 *
 * The interchange format speech therapists already use. Export lets a family
 * hand their child's board to a therapist running a different AAC app; import
 * lets a therapist's board come the other way, becoming ordinary custom tiles
 * the parent can then edit.
 *
 * A `.obf` is one board as JSON. A `.obz` is a zip of many boards plus a
 * manifest naming the root. Both are handled here with no dependency: the zip
 * is written with stored (uncompressed) entries, and read back with either
 * stored or deflated ones, so a file from any other tool still opens.
 */

import { categoryLabel, wordLabel, wordSpeech } from '../i18n';
import type { Category, Language, Word } from '../types';

const FORMAT = 'open-board-0.1';

interface ObfImage {
  id: string;
  data?: string;
  url?: string;
  path?: string;
  content_type?: string;
  width?: number;
  height?: number;
}

interface ObfButton {
  id: string;
  label?: string;
  vocalization?: string;
  image_id?: string;
  background_color?: string;
  border_color?: string;
  load_board?: { id?: string; path?: string; url?: string };
}

interface ObfBoard {
  format: string;
  id: string;
  locale: string;
  name: string;
  description_html?: string;
  buttons: ObfButton[];
  grid: { rows: number; columns: number; order: (string | null)[][] };
  images: ObfImage[];
  sounds: unknown[];
}

/* ------------------------------------------------------------------ images */

const emojiCache = new Map<string, string>();

let scratch: HTMLCanvasElement | null = null;

/**
 * Draws an emoji into a PNG so the board still has pictures in an app that
 * has never heard of our tiles. Cached — the same emoji is drawn once.
 *
 * 64px keeps a whole-board export in the low megabytes; the pictures are
 * captions on a tile, not artwork to be blown up.
 */
function emojiPng(emoji: string, size = 64): string {
  const hit = emojiCache.get(emoji);
  if (hit) return hit;
  // one canvas for the whole export: a board draws hundreds of these
  if (!scratch) {
    scratch = document.createElement('canvas');
    scratch.width = size;
    scratch.height = size;
  }
  const ctx = scratch.getContext('2d');
  if (!ctx) return '';
  ctx.clearRect(0, 0, size, size);
  ctx.font = `${Math.round(size * 0.76)}px "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.05);
  const url = scratch.toDataURL('image/png');
  emojiCache.set(emoji, url);
  return url;
}

/** Decodes a data: URL into the bytes it carries */
function dataUrlBytes(dataUrl: string): Uint8Array | null {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return null;
  const meta = dataUrl.slice(0, comma);
  const body = dataUrl.slice(comma + 1);
  if (meta.includes(';base64')) {
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return new TextEncoder().encode(decodeURIComponent(body));
}

function extensionFor(type: string): string {
  if (type.includes('svg')) return 'svg';
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  if (type.includes('webp')) return 'webp';
  return 'png';
}

/**
 * Collects the pictures a board export needs.
 *
 * Inside a `.obz` they travel as real files rather than base64 inside the
 * JSON: that is both what other tools write and a third smaller, which is the
 * difference between a board a parent can email and one they cannot.
 */
class PictureStore {
  readonly files = new Map<string, Uint8Array>();
  private readonly paths = new Map<string, string>();

  /** Returns the in-zip path for a picture, or null if it cannot travel */
  add(dataUrl: string): string | null {
    const hit = this.paths.get(dataUrl);
    if (hit) return hit;
    const bytes = dataUrlBytes(dataUrl);
    if (!bytes) return null;
    const path = `images/${this.files.size}.${extensionFor(contentType(dataUrl))}`;
    this.files.set(path, bytes);
    this.paths.set(dataUrl, path);
    return path;
  }
}

function contentType(dataUrl: string): string {
  const m = dataUrl.match(/^data:([^;,]+)/);
  return m ? m[1] : 'image/png';
}

function rgb(hex: string): string {
  const m = hex.replace('#', '');
  const n = parseInt(m.length === 3 ? m.replace(/./g, (c) => c + c) : m, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

/** Filename-safe board slug */
function slug(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'board';
}

/* ------------------------------------------------------------------ export */

function gridFor(count: number): { rows: number; columns: number } {
  const columns = Math.min(6, Math.max(2, Math.ceil(Math.sqrt(count))));
  return { columns, rows: Math.max(1, Math.ceil(count / columns)) };
}

function layout(ids: string[]): ObfBoard['grid'] {
  const { rows, columns } = gridFor(ids.length);
  const order: (string | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    order.push(
      Array.from({ length: columns }, (_, c) => ids[r * columns + c] ?? null),
    );
  }
  return { rows, columns, order };
}

function wordButton(
  word: Word,
  index: number,
  language: Language,
  images: ObfImage[],
  store: PictureStore | null,
): ObfButton {
  const id = `b${index}`;
  const picture = word.image || emojiPng(word.emoji);
  let imageId: string | undefined;
  if (picture) {
    imageId = `i${index}`;
    const path = store?.add(picture);
    images.push({
      id: imageId,
      ...(path ? { path } : { data: picture }),
      content_type: contentType(picture),
    });
  }
  const label = wordLabel(word, language);
  const spoken = wordSpeech(word, language);
  return {
    id,
    label,
    // only worth carrying when the board says one thing and speaks another
    ...(spoken && spoken !== label ? { vocalization: spoken } : {}),
    ...(imageId ? { image_id: imageId } : {}),
  };
}

function categoryBoard(
  category: Category,
  language: Language,
  store: PictureStore | null = null,
): ObfBoard {
  const images: ObfImage[] = [];
  const buttons = category.words.map((w, i) => wordButton(w, i, language, images, store));
  return {
    format: FORMAT,
    id: slug(category.id),
    locale: language,
    name: categoryLabel(category, language),
    buttons,
    grid: layout(buttons.map((b) => b.id)),
    images,
    sounds: [],
  };
}

function rootBoard(
  categories: Category[],
  language: Language,
  name: string,
  store: PictureStore,
): ObfBoard {
  const images: ObfImage[] = [];
  const buttons: ObfButton[] = categories.map((c, i) => {
    const picture = emojiPng(c.emoji);
    const path = picture ? store.add(picture) : null;
    if (picture) {
      images.push({
        id: `i${i}`,
        ...(path ? { path } : { data: picture }),
        content_type: 'image/png',
      });
    }
    return {
      id: `b${i}`,
      label: categoryLabel(c, language),
      ...(picture ? { image_id: `i${i}` } : {}),
      background_color: rgb(c.color),
      border_color: rgb(c.colorDark),
      load_board: { id: slug(c.id), path: `boards/${slug(c.id)}.obf` },
    };
  });
  return {
    format: FORMAT,
    id: 'root',
    locale: language,
    name,
    description_html: 'Exported from MTalk',
    buttons,
    grid: layout(buttons.map((b) => b.id)),
    images,
    sounds: [],
  };
}

/**
 * Packages a child's whole board as a `.obz`: a root board of categories, one
 * board per category, pictures inlined so the file works with no network.
 */
export async function exportObz(
  categories: Category[],
  language: Language,
  childName: string,
): Promise<Blob> {
  // let the caller's "Packing…" message paint before the first board is drawn
  await new Promise((resolve) => setTimeout(resolve, 0));

  const usable = categories.filter((c) => c.words.length > 0);
  const store = new PictureStore();
  const files: Record<string, Uint8Array | string> = {};
  const boardPaths: Record<string, string> = { root: 'boards/root.obf' };

  files['boards/root.obf'] = JSON.stringify(
    rootBoard(usable, language, `${childName}'s board`, store),
  );
  for (const category of usable) {
    // drawing a few hundred emoji takes seconds; hand the thread back between
    // boards so the app keeps painting instead of freezing on "Packing…"
    await new Promise((resolve) => setTimeout(resolve, 0));
    const path = `boards/${slug(category.id)}.obf`;
    files[path] = JSON.stringify(categoryBoard(category, language, store));
    boardPaths[slug(category.id)] = path;
  }

  const imagePaths: Record<string, string> = {};
  for (const [path, bytes] of store.files) {
    files[path] = bytes;
    imagePaths[path] = path;
  }
  files['manifest.json'] = JSON.stringify({
    format: FORMAT,
    root: 'boards/root.obf',
    paths: { boards: boardPaths, images: imagePaths, sounds: {} },
  });

  return zip(files);
}

/** A single category as a plain `.obf`, for tools that take one board */
export function exportObf(category: Category, language: Language): Blob {
  return new Blob([JSON.stringify(categoryBoard(category, language), null, 1)], {
    type: 'application/json',
  });
}

/* ------------------------------------------------------------------ import */

export interface ImportedTile {
  label: string;
  /** data: URL when the picture travelled with the file, http(s) when linked */
  image: string;
  /** what the button should say, when it differs from the label */
  speak?: string;
}

export interface ImportedBoard {
  name: string;
  tiles: ImportedTile[];
}

export interface ImportResult {
  boards: ImportedBoard[];
  tileCount: number;
  /** buttons whose picture is a web link rather than travelling in the file */
  linkedImages: number;
  /** buttons that only navigate to another board — not tiles */
  navigationButtons: number;
  /** recorded button sounds, which MTalk cannot carry across */
  droppedSounds: number;
}

function readBoard(
  board: ObfBoard,
  imagesByPath: Map<string, string>,
  result: ImportResult,
): ImportedBoard {
  const images = new Map<string, ObfImage>();
  for (const img of board.images ?? []) images.set(String(img.id), img);

  const tiles: ImportedTile[] = [];
  for (const button of board.buttons ?? []) {
    if (button.load_board) {
      result.navigationButtons++;
      continue;
    }
    const img = button.image_id != null ? images.get(String(button.image_id)) : undefined;
    let picture = '';
    if (img?.data) picture = img.data;
    else if (img?.path && imagesByPath.has(img.path)) picture = imagesByPath.get(img.path) ?? '';
    else if (img?.url) {
      picture = img.url;
      result.linkedImages++;
    }
    const label = (button.label ?? button.vocalization ?? '').trim();
    if (!label && !picture) continue;
    tiles.push({
      label: label || 'Tile',
      image: picture,
      ...(button.vocalization && button.vocalization !== label
        ? { speak: button.vocalization }
        : {}),
    });
  }
  return { name: (board.name || 'Imported board').trim(), tiles };
}

/** Reads a `.obf` or `.obz` into boards of plain tiles */
export async function importBoardFile(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    boards: [],
    tileCount: 0,
    linkedImages: 0,
    navigationButtons: 0,
    droppedSounds: 0,
  };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;

  if (!isZip) {
    const board = JSON.parse(new TextDecoder().decode(bytes)) as ObfBoard;
    result.droppedSounds += (board.sounds ?? []).length;
    result.boards.push(readBoard(board, new Map(), result));
  } else {
    const entries = await unzip(bytes);
    const text = (path: string) => {
      const data = entries.get(path);
      return data ? new TextDecoder().decode(data) : null;
    };

    // pictures stored as files rather than inline
    const imagesByPath = new Map<string, string>();
    for (const [path, data] of entries) {
      if (!/\.(png|jpe?g|gif|svg|webp)$/i.test(path)) continue;
      const type = path.match(/\.svg$/i) ? 'image/svg+xml' : `image/${path.split('.').pop()}`;
      imagesByPath.set(path, `data:${type};base64,${base64(data)}`);
    }

    const manifestText = text('manifest.json');
    const boardPaths: string[] = [];
    if (manifestText) {
      const manifest = JSON.parse(manifestText);
      const listed: string[] = Object.values(manifest?.paths?.boards ?? {});
      if (manifest?.root) boardPaths.push(manifest.root);
      for (const p of listed) if (!boardPaths.includes(p)) boardPaths.push(p);
    }
    if (boardPaths.length === 0) {
      for (const path of entries.keys()) if (path.endsWith('.obf')) boardPaths.push(path);
    }

    for (const path of boardPaths) {
      const raw = text(path);
      if (!raw) continue;
      try {
        const board = JSON.parse(raw) as ObfBoard;
        result.droppedSounds += (board.sounds ?? []).length;
        const imported = readBoard(board, imagesByPath, result);
        if (imported.tiles.length > 0) result.boards.push(imported);
      } catch {
        // one unreadable board should not lose the rest of the file
      }
    }
  }

  result.tileCount = result.boards.reduce((n, b) => n + b.tiles.length, 0);
  return result;
}

/* --------------------------------------------------------------------- zip */

function base64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000; // String.fromCharCode has an argument limit
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Writes a zip with stored (uncompressed) entries.
 *
 * The bulk of an exported board is already-compressed PNG data, so deflating
 * would buy little; storing keeps the writer small enough to be obviously
 * correct, and every unzipper reads it.
 */
function zip(files: Record<string, Uint8Array | string>): Blob {
  const encoder = new TextEncoder();
  const parts: BlobPart[] = [];
  const central: BlobPart[] = [];
  let centralSize = 0;
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = typeof content === 'string' ? encoder.encode(content) : content;
    const sum = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // stored
    local.setUint32(14, sum, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    parts.push(local.buffer, nameBytes as BlobPart, data as BlobPart);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(10, 0, true);
    entry.setUint32(16, sum, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, nameBytes.length, true);
    entry.setUint32(42, offset, true);
    const record = new Uint8Array(46 + nameBytes.length);
    record.set(new Uint8Array(entry.buffer), 0);
    record.set(nameBytes, 46);
    central.push(record as BlobPart);
    centralSize += record.length;

    offset += 30 + nameBytes.length + data.length;
  }

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, central.length, true);
  end.setUint16(10, central.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Reads a zip by walking its central directory. Both stored and deflated
 * entries are supported, because a board exported by another AAC app is
 * almost always deflated.
 */
async function unzip(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 0x10000; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip');

  const count = view.getUint16(eocd + 10, true);
  let pointer = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const out = new Map<string, Uint8Array>();

  for (let i = 0; i < count; i++) {
    if (view.getUint32(pointer, true) !== 0x02014b50) break;
    const method = view.getUint16(pointer + 10, true);
    const compressedSize = view.getUint32(pointer + 20, true);
    const nameLength = view.getUint16(pointer + 28, true);
    const extraLength = view.getUint16(pointer + 30, true);
    const commentLength = view.getUint16(pointer + 32, true);
    const localOffset = view.getUint32(pointer + 42, true);
    const name = decoder.decode(bytes.subarray(pointer + 46, pointer + 46 + nameLength));

    // the local header repeats the name and extra field at its own lengths
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const raw = bytes.subarray(start, start + compressedSize);

    // some zip writers (Windows among them) use backslashes as separators
    const path = name.replace(/\\/g, '/');
    if (!path.endsWith('/')) {
      out.set(path, method === 0 ? raw : await inflateRaw(raw));
    }
    pointer += 46 + nameLength + extraLength + commentLength;
  }
  return out;
}
