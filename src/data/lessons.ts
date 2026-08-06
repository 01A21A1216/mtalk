import type { Instrument } from './instruments';
import type { TablaBol } from '../services/audioEngine';

/**
 * Tiny music lessons for children who do not speak.
 *
 * The whole design rule: **nothing is explained, everything is shown.** The
 * app plays a note and makes that exact key glow; the child copies it. No
 * instruction to read, no sentence to understand, no answer to say out loud.
 *
 * A wrong tap is never a failure — the target simply plays again. Children
 * who are used to getting things wrong stop trying, so there is no score, no
 * timer and no way to lose.
 */

export interface LessonTarget {
  /** what has to be pressed for the step to pass */
  midi?: number;
  bol?: TablaBol;
  piece?: string;
}

export interface Lesson {
  id: string;
  instrument: Instrument;
  emoji: string;
  /** for the grown-up; the child never needs to read it */
  title: string;
  steps: LessonTarget[];
}

export const LESSONS: Lesson[] = [
  {
    id: 'piano-first',
    instrument: 'piano',
    emoji: '🎹',
    title: 'Sa Re Ga',
    steps: [{ midi: 60 }, { midi: 62 }, { midi: 64 }],
  },
  {
    id: 'piano-up',
    instrument: 'piano',
    emoji: '🪜',
    title: 'Climb the stairs',
    steps: [{ midi: 60 }, { midi: 62 }, { midi: 64 }, { midi: 65 }, { midi: 67 }],
  },
  {
    id: 'piano-twinkle',
    instrument: 'piano',
    emoji: '⭐',
    title: 'Twinkle twinkle',
    steps: [
      { midi: 60 },
      { midi: 60 },
      { midi: 67 },
      { midi: 67 },
      { midi: 69 },
      { midi: 69 },
      { midi: 67 },
    ],
  },
  {
    id: 'xylo-rainbow',
    instrument: 'xylophone',
    emoji: '🌈',
    title: 'Rainbow ladder',
    steps: [
      { midi: 60 },
      { midi: 62 },
      { midi: 64 },
      { midi: 65 },
      { midi: 67 },
      { midi: 69 },
      { midi: 71 },
      { midi: 72 },
    ],
  },
  {
    id: 'xylo-jump',
    instrument: 'xylophone',
    emoji: '🐸',
    title: 'Low and high',
    steps: [{ midi: 60 }, { midi: 72 }, { midi: 60 }, { midi: 72 }],
  },
  {
    id: 'tabla-first',
    instrument: 'tabla',
    emoji: '🪘',
    title: 'Dha Tin Na',
    steps: [{ bol: 'dha' }, { bol: 'tin' }, { bol: 'na' }],
  },
  {
    id: 'tabla-dadra',
    instrument: 'tabla',
    emoji: '🔁',
    title: 'Dadra, slowly',
    steps: [
      { bol: 'dha' },
      { bol: 'tin' },
      { bol: 'na' },
      { bol: 'dha' },
      { bol: 'tin' },
      { bol: 'na' },
    ],
  },
  {
    id: 'drums-beat',
    instrument: 'drums',
    emoji: '🥁',
    title: 'Boom clap',
    steps: [
      { piece: 'kick' },
      { piece: 'snare' },
      { piece: 'kick' },
      { piece: 'snare' },
    ],
  },
];

export const lessonsFor = (instrument: Instrument) =>
  LESSONS.filter((l) => l.instrument === instrument);
