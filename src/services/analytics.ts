import type { Category, WordStat } from '../types';

/**
 * Turns the raw per-child stores into the numbers a parent actually wants.
 *
 * Kept as pure functions, separate from any component: the dashboard should be
 * easy to reason about, and these are the parts worth being careful with.
 *
 * A word on framing. This is an AAC app, not a leaderboard. A quiet week is
 * usually a busy family, an illness, a holiday — not a child failing. So the
 * numbers here describe *what the child said*, and deliberately avoid targets,
 * grades or streak-breaking language.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;
export const epochDay = (ts: number = Date.now()) => Math.floor(ts / DAY_MS);

export interface WordUsage {
  total: number;
  firstDay: number;
  byDay: Record<string, number>;
}
export type UsageMap = Record<string, WordUsage>;

export interface DayPoint {
  day: number;
  taps: number;
  /** distinct words tapped that day */
  words: number;
  label: string;
  weekday: string;
}

/** Daily activity for the last `days` days, oldest first, gaps filled with 0 */
export function dailySeries(usage: UsageMap, days: number): DayPoint[] {
  const end = epochDay();
  const start = end - days + 1;
  const taps = new Map<number, number>();
  const words = new Map<number, Set<string>>();

  for (const [id, u] of Object.entries(usage)) {
    for (const [key, count] of Object.entries(u.byDay)) {
      const day = Number(key);
      if (day < start || day > end) continue;
      taps.set(day, (taps.get(day) ?? 0) + count);
      const set = words.get(day) ?? new Set<string>();
      set.add(id);
      words.set(day, set);
    }
  }

  return Array.from({ length: days }, (_, i) => {
    const day = start + i;
    const date = new Date(day * DAY_MS);
    return {
      day,
      taps: taps.get(day) ?? 0,
      words: words.get(day)?.size ?? 0,
      label: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      weekday: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
    };
  });
}

export interface Summary {
  taps: number;
  uniqueWords: number;
  newWords: number;
  activeDays: number;
  busiest: DayPoint | null;
  /** consecutive days with activity, counted back from today or yesterday */
  streak: number;
}

export function summarise(usage: UsageMap, days: number): Summary {
  const series = dailySeries(usage, days);
  const start = epochDay() - days + 1;
  const seen = new Set<string>();
  let newWords = 0;

  for (const [id, u] of Object.entries(usage)) {
    const usedInRange = Object.entries(u.byDay).some(
      ([day, count]) => Number(day) >= start && count > 0,
    );
    if (usedInRange) seen.add(id);
    if (u.firstDay >= start) newWords += 1;
  }

  const active = series.filter((d) => d.taps > 0);
  const busiest = active.reduce<DayPoint | null>(
    (best, d) => (!best || d.taps > best.taps ? d : best),
    null,
  );

  // Today counting as a gap would show "0 days" every morning, which reads as
  // failure before the day has started — so the count may end at yesterday.
  const byDay = new Map(series.map((d) => [d.day, d.taps]));
  let streak = 0;
  let cursor = epochDay();
  if ((byDay.get(cursor) ?? 0) === 0) cursor -= 1;
  while ((byDay.get(cursor) ?? 0) > 0) {
    streak += 1;
    cursor -= 1;
  }

  return {
    taps: series.reduce((sum, d) => sum + d.taps, 0),
    uniqueWords: seen.size,
    newWords,
    activeDays: active.length,
    busiest,
    streak,
  };
}

export interface CategoryCoverage {
  id: string;
  name: string;
  emoji: string;
  color: string;
  colorDark: string;
  used: number;
  available: number;
  taps: number;
}

/**
 * How much of each category the child has actually reached for. Coverage is
 * about breadth of vocabulary, which matters more than raw tap counts: fifty
 * taps on one tile is a habit, fifty words is a growing voice.
 */
/**
 * Derived categories are excluded: Favourites *is* the most-used words, so its
 * coverage would always read 100% and mean nothing, and videos are watching
 * rather than talking.
 */
const DERIVED_CATEGORIES = new Set(['favorites', 'videos']);

export function categoryCoverage(
  usage: UsageMap,
  categories: Category[],
  ageMode: number,
): CategoryCoverage[] {
  return categories
    .filter((cat) => !DERIVED_CATEGORIES.has(cat.id))
    .map((cat) => {
      const words = cat.words.filter((w) => w.level <= ageMode);
      let used = 0;
      let taps = 0;
      for (const word of words) {
        const u = usage[word.id];
        if (u?.total) {
          used += 1;
          taps += u.total;
        }
      }
      return {
        id: cat.id,
        name: cat.en,
        emoji: cat.emoji,
        color: cat.color,
        colorDark: cat.colorDark,
        used,
        available: words.length,
        taps,
      };
    })
    .filter((c) => c.available > 0)
    .sort((a, b) => b.taps - a.taps);
}

export interface QuizSummary {
  attempts: number;
  correct: number;
  accuracy: number;
  mastered: number;
  practising: number;
  /** lowest-accuracy words with enough attempts to mean something */
  tricky: { id: string; accuracy: number; attempts: number }[];
}

export function quizSummary(
  stats: Record<string, WordStat>,
  masteryStreak: number,
): QuizSummary {
  let attempts = 0;
  let correct = 0;
  let mastered = 0;
  const tricky: QuizSummary['tricky'] = [];

  for (const [id, s] of Object.entries(stats)) {
    attempts += s.attempts;
    correct += s.correct;
    if (s.streak >= masteryStreak) mastered += 1;
    else if (s.attempts >= 3) {
      tricky.push({ id, accuracy: s.correct / s.attempts, attempts: s.attempts });
    }
  }

  return {
    attempts,
    correct,
    accuracy: attempts ? correct / attempts : 0,
    mastered,
    practising: Object.keys(stats).length - mastered,
    tricky: tricky.sort((a, b) => a.accuracy - b.accuracy).slice(0, 5),
  };
}

export interface SentenceSummary {
  count: number;
  longest: number;
  average: number;
}

export function sentenceSummary(
  history: { wordIds: string[]; ts: number }[],
): SentenceSummary {
  if (!history.length) return { count: 0, longest: 0, average: 0 };
  const lengths = history.map((h) => h.wordIds.length);
  return {
    count: history.length,
    longest: Math.max(...lengths),
    average: lengths.reduce((a, b) => a + b, 0) / lengths.length,
  };
}

/** Word ids ranked by taps inside the range, most-used first */
export function topWordsInRange(usage: UsageMap, days: number, limit: number) {
  const start = epochDay() - days + 1;
  return Object.entries(usage)
    .map(([id, u]) => ({
      id,
      taps: Object.entries(u.byDay).reduce(
        (sum, [day, count]) => (Number(day) >= start ? sum + count : sum),
        0,
      ),
    }))
    .filter((w) => w.taps > 0)
    .sort((a, b) => b.taps - a.taps)
    .slice(0, limit);
}
