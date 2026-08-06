import type { Word } from '../types';

/**
 * Counting tiles beyond the curated 1–10.
 *
 * The built-in Numbers category carries 1–10 with proper English and Hindi
 * words ("One" / "एक"), which is what a child first learns. Past ten, the
 * numeral itself is the thing being taught, so these tiles show the digits
 * big and let the voice read them — no attempt at spelling out "six hundred
 * and forty-three", which is where hand-written word lists go wrong.
 */

export const NUMBERS_MAX = 1000;
/** The board never shows fewer than this many */
export const NUMBERS_START = 10;
export const NUMBERS_STEP = 10;

/**
 * 1–10 keep the ids the built-in word tiles used, so a child's tap history,
 * quiz scores and pinned home tiles survive the change to numeral tiles.
 */
const CANONICAL_IDS = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
];

const DEVANAGARI = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

/** 247 → २४७ — the numeral a Hindi-medium child sees at school */
export const toDevanagari = (n: number) =>
  String(n)
    .split('')
    .map((d) => DEVANAGARI[Number(d)])
    .join('');

/**
 * Tiles for 1…limit, every one the same: the numeral itself, big, with the
 * Devanagari numeral underneath. Speech uses plain digits in both languages —
 * a voice reads "247" correctly, while "२४७" is unreliable across engines.
 */
export function numberWords(limit: number): Word[] {
  const top = Math.min(Math.max(limit, NUMBERS_START), NUMBERS_MAX);
  const words: Word[] = [];
  for (let n = 1; n <= top; n++) {
    words.push({
      id: n <= CANONICAL_IDS.length ? CANONICAL_IDS[n - 1] : `num-${n}`,
      emoji: String(n),
      en: String(n),
      hi: toDevanagari(n),
      level: 1,
      speakEn: String(n),
      speakHi: String(n),
    });
  }
  return words;
}
