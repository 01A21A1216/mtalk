import { epochDay, type UsageMap } from './analytics';
import type { Category, HistoryEntry, Word } from '../types';

/**
 * Turns what a child actually said into one or two things a grown-up can try
 * this week.
 *
 * Rules, not a model: every tip must be traceable to a number the parent can
 * see on the same screen. And the tone matters more than the cleverness — a
 * parent of a non-verbal child hears enough about what their child cannot do,
 * so nothing here scolds, ranks or compares to other children.
 */

export interface Tip {
  id: string;
  emoji: string;
  text: string;
  /** The observation behind it, so the advice never looks arbitrary */
  because: string;
}

const DERIVED = new Set(['favorites', 'videos', 'my-words']);

export function coachingTips(
  usage: UsageMap,
  history: HistoryEntry[],
  categories: Category[],
  wordIndex: Map<string, Word>,
  days: number,
  childName: string,
): Tip[] {
  const since = epochDay() - days + 1;
  const tips: Tip[] = [];

  const inRange = Object.entries(usage)
    .map(([id, u]) => ({
      id,
      taps: Object.entries(u.byDay).reduce(
        (sum, [day, n]) => (Number(day) >= since ? sum + n : sum),
        0,
      ),
      firstDay: u.firstDay,
    }))
    .filter((w) => w.taps > 0)
    .sort((a, b) => b.taps - a.taps);

  const label = (id: string) => wordIndex.get(id)?.en ?? id;
  const total = inRange.reduce((sum, w) => sum + w.taps, 0);

  if (total === 0) return tips;

  // 1. A favourite word is the best hook for a two-word phrase
  const top = inRange[0];
  const avgLength = history.length
    ? history.reduce((sum, h) => sum + h.wordIds.length, 0) / history.length
    : 0;
  if (top && avgLength < 2.5) {
    tips.push({
      id: 'combine',
      emoji: '➕',
      // "+1 modelling": echo the child's word and add exactly one more, then
      // wait. Inventing example phrases here produced odd pairings, so the
      // advice describes the move instead of scripting it.
      text: `When ${childName} taps “${label(top.id)}”, say it back and add one word of your own — then pause and give them a moment. One word more than they used is the right size of step.`,
      because: `“${label(top.id)}” is ${childName}'s most-tapped word (${top.taps} times), and sentences are averaging ${avgLength ? avgLength.toFixed(1) : 'one'} word${avgLength >= 2 ? 's' : ''}.`,
    });
  }

  // 2. A whole category going untouched is worth a nudge, gently framed
  const untouched = categories
    .filter((c) => !DERIVED.has(c.id) && c.words.length >= 4)
    .map((c) => ({
      cat: c,
      used: c.words.filter((w) => (usage[w.id]?.total ?? 0) > 0).length,
    }))
    .filter((c) => c.used === 0);
  if (untouched.length) {
    const pick = untouched[0].cat;
    tips.push({
      id: `explore-${pick.id}`,
      emoji: pick.emoji,
      text: `${pick.en} hasn't been opened yet. Model two or three of them yourself during the day — no need for ${childName} to copy straight away.`,
      because: `No word from ${pick.en} has been tapped.`,
    });
  }

  // 3. Something new is always worth naming out loud
  const fresh = inRange.filter((w) => w.firstDay >= since).slice(0, 3);
  if (fresh.length) {
    tips.push({
      id: 'new-words',
      emoji: '🌱',
      text: `New this week: ${fresh.map((w) => `“${label(w.id)}”`).join(', ')}. Use ${fresh.length > 1 ? 'them' : 'it'} a few more times in real moments so ${fresh.length > 1 ? 'they stick' : 'it sticks'}.`,
      because: `First ever use in the last ${days} days.`,
    });
  }

  // 4. One tile carrying most of the taps: the board may be too small
  if (top && total >= 10 && top.taps / total > 0.4) {
    tips.push({
      id: 'widen',
      emoji: '🔎',
      text: `Almost everything goes through “${label(top.id)}”. That usually means the word for what ${childName} wants isn't on the board yet — worth adding a tile or two from what they reach for.`,
      because: `“${label(top.id)}” is ${Math.round((top.taps / total) * 100)}% of all taps.`,
    });
  }

  return tips.slice(0, 3);
}
