import { SCRIPT_SETS, type TraceItem } from '../data/traceSets';
import { wordLabel } from '../i18n';
import type { Language, Word } from '../types';

/**
 * "Which word starts with this?" — across six writing systems.
 *
 * The unit a child learns first is not the same thing in every script:
 *
 *  - English is alphabetic. The unit is a letter, and B is a sound.
 *  - Devanagari, Bengali, Telugu and Kannada are abugidas. The unit is an
 *    akshara — a consonant carrying an inherent vowel — and क is already "ka",
 *    not "k". The vowel signs that change it (कि, की, कु) hang off that same
 *    consonant, which is why a child learning क should still recognise किताब
 *    as starting with क.
 *  - Tamil works the same way, with uyirmei built from mei plus a vowel sign.
 *
 * That difference is exactly what makes a single "first sound" game wrong for
 * six of the seven languages. What *is* shared is the shape of the question:
 * here is one unit of the script, which of these words begins with it. The
 * unit comes from each language's own alphabet, in the order that language's
 * schools teach it, so the game is native everywhere rather than English with
 * translated labels.
 *
 * The rule below falls out of how these scripts are encoded: vowel signs and
 * virama are *combining* marks that follow their base, so the first code point
 * of a word is its base letter in every one of them.
 */

const LATIN: TraceItem[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  .split('')
  .map((glyph) => ({ glyph, name: glyph }));

/** The letters this language teaches, in its own teaching order */
export function alphabetFor(language: Language): TraceItem[] {
  if (language === 'en') return LATIN;
  return SCRIPT_SETS[language]?.items ?? LATIN;
}

/**
 * The letter a word begins with, as that script counts it.
 *
 * Conjuncts (क्ष, ক্ষ) reduce to their first consonant, which is what a child
 * working through the alphabet has been taught to look for.
 */
export function firstLetter(label: string, language: Language): string {
  const text = label.trim();
  if (!text) return '';
  const first = [...text][0];
  return language === 'en' ? first.toUpperCase() : first;
}

/** True when this word begins with this letter, in this language */
export function startsWith(word: Word, letter: string, language: Language): boolean {
  return firstLetter(wordLabel(word, language), language) === letter;
}

/**
 * Letters that actually have a word behind them, with those words.
 *
 * A letter with nothing to show is not a lesson, so the game only ever asks
 * about letters this child's board can answer — which also means it teaches
 * words they already have rather than a stock list.
 */
export function letterIndex(
  words: Word[],
  language: Language,
): { letter: string; name: string; words: Word[] }[] {
  const byLetter = new Map<string, Word[]>();
  for (const word of words) {
    const key = firstLetter(wordLabel(word, language), language);
    if (!key) continue;
    const list = byLetter.get(key);
    if (list) list.push(word);
    else byLetter.set(key, [word]);
  }
  // keep the alphabet's own order rather than whatever order the board is in
  return alphabetFor(language)
    .filter((item) => byLetter.has(item.glyph))
    .map((item) => ({
      letter: item.glyph,
      name: item.name,
      words: byLetter.get(item.glyph) ?? [],
    }));
}
