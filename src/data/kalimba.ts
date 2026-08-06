/**
 * Kalimba tunings.
 *
 * Tines are laid out in a V: the longest, lowest one in the middle, each next
 * note alternating right then left as it climbs. That is why a kalimba player
 * reads music as a zigzag — and why the layout has to be generated rather
 * than written out by hand, so the note and its position can never disagree.
 */

export interface Tuning {
  id: string;
  name: string;
  /** for the grown-up choosing it */
  note: string;
  /** ascending midi notes, lowest first */
  notes: number[];
}

const major = (root: number, count: number) => {
  const steps = [0, 2, 4, 5, 7, 9, 11];
  return Array.from({ length: count }, (_, i) => {
    const octave = Math.floor(i / 7);
    return root + octave * 12 + steps[i % 7];
  });
};

export const TUNINGS: Tuning[] = [
  {
    id: 'c10',
    name: '10 keys',
    note: 'fewer tines — a calmer first instrument',
    notes: major(60, 10),
  },
  {
    id: 'c17',
    name: '17 keys · C',
    note: 'the usual kalimba',
    notes: major(60, 17),
  },
  {
    id: 'g17',
    name: '17 keys · G',
    note: 'brighter, sits well with singing',
    notes: major(55, 17),
  },
];

export interface Tine {
  midi: number;
  /** 0 is the leftmost tine on the board */
  slot: number;
  /** 1 for the longest centre tine, falling as the notes rise */
  length: number;
}

/** Turns an ascending scale into the V that a kalimba actually is */
export function layout(notes: number[]): Tine[] {
  const centre = Math.floor((notes.length - 1) / 2);
  return notes.map((midi, i) => {
    const rank = Math.ceil(i / 2);
    const side = i % 2 === 1 ? 1 : -1;
    return {
      midi,
      slot: centre + side * rank,
      // the tine's visible length: longest in the middle, shortest at the ends
      length: 1 - (rank / (centre + 1)) * 0.45,
    };
  });
}
