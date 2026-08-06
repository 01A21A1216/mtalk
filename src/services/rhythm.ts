import {
  playDrum,
  playEPad,
  playPianoNote,
  playHandpan,
  playKalimba,
  playTambourine,
  playPluck,
  playTabla,
  playXylophone,
  strum,
  type DrumKind,
  type EPadKind,
  type TambourineHit,
  type TablaBol,
} from './audioEngine';

/**
 * One thing a child did on an instrument.
 *
 * Everything the music room can play is described as data rather than a
 * closure, so a performance can be recorded, replayed, compared against a
 * pattern, and one day saved — without any of those features needing to know
 * how the sounds are actually made.
 */
export type Action =
  | { type: 'piano'; midi: number; velocity: number; sustain: boolean }
  | { type: 'xylo'; midi: number; strike: number }
  | { type: 'handpan'; midi: number; strike: number }
  | { type: 'kalimba'; midi: number; strike: number }
  | { type: 'pluck'; midi: number }
  | { type: 'strum'; midis: number[]; direction: 'down' | 'up' }
  | { type: 'drum'; kind: DrumKind }
  | { type: 'epad'; kind: EPadKind; velocity: number }
  | { type: 'tabla'; bol: TablaBol }
  | { type: 'tambourine'; hit: TambourineHit; velocity: number };

export interface Beat {
  /** milliseconds since the recording started */
  at: number;
  action: Action;
}

/** Plays a single recorded action */
export function perform(action: Action) {
  switch (action.type) {
    case 'piano':
      playPianoNote(action.midi, action.velocity, action.sustain);
      break;
    case 'xylo':
      playXylophone(action.midi, action.strike);
      break;
    case 'handpan':
      playHandpan(action.midi, action.strike);
      break;
    case 'kalimba':
      playKalimba(action.midi, action.strike);
      break;
    case 'pluck':
      playPluck(action.midi);
      break;
    case 'strum':
      strum(action.midis, action.direction);
      break;
    case 'drum':
      playDrum(action.kind);
      break;
    case 'epad':
      playEPad(action.kind, action.velocity);
      break;
    case 'tabla':
      playTabla(action.bol);
      break;
    case 'tambourine':
      playTambourine(action.hit, action.velocity);
      break;
  }
}

/** A short label for the readout and the copy-me game */
export function actionLabel(action: Action): string {
  switch (action.type) {
    case 'tabla':
      return action.bol.toUpperCase();
    case 'drum':
      return action.kind;
    case 'epad':
      return action.kind;
    default:
      return action.type;
  }
}

/**
 * Replays a recording. Returns a stop function — a child who taps play twice,
 * or leaves the tab, should not be chased by a performance that outlives it.
 */
export function playBack(beats: Beat[], onBeat?: (i: number) => void): () => void {
  const timers = beats.map((beat, i) =>
    window.setTimeout(() => {
      perform(beat.action);
      onBeat?.(i);
    }, beat.at),
  );
  return () => timers.forEach((t) => window.clearTimeout(t));
}
