/**
 * Per-child category preferences: which categories a child sees, and in what
 * order. Stored as ids in Settings so the built-in vocabulary stays untouched
 * and a preference can never orphan a word.
 */

interface Identified {
  id: string;
}

/**
 * Applies the parent's chosen order, then drops hidden categories.
 *
 * Anything not named in `order` keeps its original position *after* the
 * ordered ones — so a category added in a later app version simply appears,
 * rather than vanishing because an old preference list never mentioned it.
 */
export function applyCategoryPrefs<T extends Identified>(
  categories: T[],
  order: string[] = [],
  hidden: string[] = [],
): T[] {
  const rank = new Map(order.map((id, i) => [id, i]));
  const sorted = [...categories].sort((a, b) => {
    const ra = rank.get(a.id);
    const rb = rank.get(b.id);
    if (ra != null && rb != null) return ra - rb;
    if (ra != null) return -1;
    if (rb != null) return 1;
    return 0; // both unknown: keep the order they arrived in
  });
  const hiddenSet = new Set(hidden);
  const visible = sorted.filter((c) => !hiddenSet.has(c.id));
  // A board with no categories would leave the child with nothing to say, so
  // an over-eager hide list is ignored rather than obeyed.
  return visible.length ? visible : sorted;
}

/** Moves one id by `delta` places and returns the full order it implies */
export function reorder(ids: string[], id: string, delta: number): string[] {
  const from = ids.indexOf(id);
  if (from < 0) return ids;
  const to = Math.min(ids.length - 1, Math.max(0, from + delta));
  if (to === from) return ids;
  const next = [...ids];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}
