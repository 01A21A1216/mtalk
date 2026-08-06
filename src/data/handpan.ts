/**
 * Handpan scales.
 *
 * A handpan is tuned to one scale and one only — that is why a beginner can
 * play it without hitting a wrong note, and why it suits a child who cannot
 * be told which notes to avoid. `ding` is the deep note in the middle; the
 * fields ring it, alternating side to side as they climb, the way they are
 * laid out on the real shell.
 */

export interface HandpanScale {
  id: string;
  name: string;
  /** what a grown-up might recognise it by */
  mood: string;
  ding: number;
  fields: number[];
}

/**
 * Drone notes offered under the handpan.
 *
 * These are just low pitches that sit under the scale pleasantly. They are
 * offered because a steady low note is calming to listen to — not because any
 * particular number does anything to a child. 136.1 Hz is included because
 * players ask for it by name, and it is labelled for what it is.
 */
export const DRONES = [
  { hz: 73.4, label: 'D — under the pan' },
  { hz: 100, label: '100 Hz — very low' },
  { hz: 110, label: '110 Hz — low A' },
  { hz: 136.1, label: '136.1 Hz — the “om” pitch players ask for' },
  { hz: 146.8, label: 'D — an octave up' },
];

/** Concert-pitch options. A matter of taste; see the note in audioEngine. */
export const TUNING_REFS = [432, 440, 444];

export const HANDPAN_SCALES: HandpanScale[] = [
  {
    id: 'kurd',
    name: 'D Kurd',
    mood: 'calm, the usual first handpan',
    ding: 50, // D3
    fields: [57, 58, 60, 62, 64, 65, 67, 69], // A Bb C D E F G A
  },
  {
    id: 'celtic',
    name: 'D Celtic',
    mood: 'wistful, folk',
    ding: 50,
    fields: [57, 60, 62, 64, 65, 67, 69, 72], // A C D E F G A C
  },
  {
    id: 'hijaz',
    name: 'D Hijaz',
    mood: 'the flattened second — a South Asian ear knows it at once',
    ding: 50,
    fields: [57, 58, 61, 62, 64, 65, 68, 69], // A Bb C# D E F G# A
  },
  {
    id: 'bhairav',
    name: 'Raga Bhairav',
    mood: 'morning raga',
    ding: 50,
    fields: [57, 58, 62, 64, 65, 69, 70, 74], // Sa-flavoured, komal Re and Dha
  },
];
