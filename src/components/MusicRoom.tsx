import { useEffect, useRef, useState } from 'react';
import {
  // the instruments themselves go through fire() so they can be recorded;
  // playTabla is called directly only by the taal loop and the copy-me game,
  // which are the app playing rather than the child
  playTabla,
  playDrum,
  playHandpan,
  playHandpanSlap,
  setTuningA,
  startDrone,
  playPianoNote,
  playWoodKnock,
  playXylophone,
  type DrumKind,
  type EPadKind,
  type TablaBol,
} from '../services/audioEngine';

import { TAALS } from '../data/taals';
import { lessonsFor, type Lesson } from '../data/lessons';
import { DRONES, HANDPAN_SCALES, TUNING_REFS } from '../data/handpan';
import { TUNINGS, layout } from '../data/kalimba';
import { perform, playBack, type Action, type Beat } from '../services/rhythm';
import type { Instrument } from '../data/instruments';

/** White keys of C major over two octaves, with the sargam a child is taught */
const WHITE_KEYS = [
  { midi: 60, letter: 'C', sargam: 'Sa' },
  { midi: 62, letter: 'D', sargam: 'Re' },
  { midi: 64, letter: 'E', sargam: 'Ga' },
  { midi: 65, letter: 'F', sargam: 'Ma' },
  { midi: 67, letter: 'G', sargam: 'Pa' },
  { midi: 69, letter: 'A', sargam: 'Dha' },
  { midi: 71, letter: 'B', sargam: 'Ni' },
  { midi: 72, letter: 'C', sargam: 'Sa' },
  { midi: 74, letter: 'D', sargam: 'Re' },
  { midi: 76, letter: 'E', sargam: 'Ga' },
  { midi: 77, letter: 'F', sargam: 'Ma' },
  { midi: 79, letter: 'G', sargam: 'Pa' },
];

/** Black keys sit between white ones; `after` is the white key index it follows */
const BLACK_KEYS = [
  { midi: 61, after: 0 },
  { midi: 63, after: 1 },
  { midi: 66, after: 3 },
  { midi: 68, after: 4 },
  { midi: 70, after: 5 },
  { midi: 73, after: 7 },
  { midi: 75, after: 8 },
  { midi: 78, after: 10 },
];

/**
 * A concert xylophone rather than a toy: naturals along the front, sharps
 * raised behind them like a keyboard, and bars that shorten as they rise.
 * Colours still follow the rainbow so a child can be told "hit the red one".
 */
const XYLO_COLORS = [
  '#e53935',
  '#fb8c00',
  '#fdd835',
  '#43a047',
  '#1e88e5',
  '#3949ab',
  '#8e24aa',
];
const SARGAM = ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'];
const NATURAL_STEPS = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B

/** Naturals C4 → C6, two full octaves */
const XYLO_NATURALS = Array.from({ length: 15 }, (_, i) => {
  const octave = Math.floor(i / 7);
  const step = i % 7;
  return {
    midi: 60 + octave * 12 + NATURAL_STEPS[step],
    letter: ['C', 'D', 'E', 'F', 'G', 'A', 'B'][step],
    sargam: SARGAM[step],
    color: XYLO_COLORS[step],
  };
});

/** Sharps sit behind, in the gaps — none between E–F or B–C, as on a keyboard */
const XYLO_SHARPS = XYLO_NATURALS.flatMap((bar, i) => {
  const step = i % 7;
  const hasSharp = step !== 2 && step !== 6; // not after E, not after B
  return hasSharp && i < XYLO_NATURALS.length - 1
    ? [{ midi: bar.midi + 1, letter: `${bar.letter}#`, after: i }]
    : [];
});

/** Open strings of a guitar, low to high */
const STRINGS = [
  { midi: 40, name: 'E' },
  { midi: 45, name: 'A' },
  { midi: 50, name: 'D' },
  { midi: 55, name: 'G' },
  { midi: 59, name: 'B' },
  { midi: 64, name: 'e' },
];

/** Frets shown on the neck — enough for first chords, big enough to hit */
const FRETS = 5;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = (midi: number) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

/**
 * Real chord shapes, low string to high. `null` means that string is not
 * played; a number is the fret to hold down. Deriving the notes from the
 * shape means the dots shown on the neck and the sound always agree.
 */
const CHORDS: { name: string; shape: (number | null)[] }[] = [
  { name: 'C', shape: [null, 3, 2, 0, 1, 0] },
  { name: 'G', shape: [3, 2, 0, 0, 0, 3] },
  { name: 'D', shape: [null, null, 0, 2, 3, 2] },
  { name: 'Em', shape: [0, 2, 2, 0, 0, 0] },
  { name: 'Am', shape: [null, 0, 2, 2, 1, 0] },
  { name: 'E', shape: [0, 2, 2, 1, 0, 0] },
];

/**
 * A kit seen from the drummer's stool. Positions are percentages of the
 * stage, so the whole thing scales with the screen.
 *
 * `zoned` pieces answer differently depending on where they are struck — the
 * middle of a snare is not the rim, and a cymbal's bell is not its edge.
 */
type Piece = {
  id: string;
  label: string;
  kind: DrumKind;
  /** struck near the middle instead — rimshot, closed hat, bell */
  centreKind?: DrumKind;
  centreLabel?: string;
  type: 'drum' | 'cymbal';
  x: number;
  y: number;
  size: number;
};

const KIT: Piece[] = [
  { id: 'crash', label: 'Crash', kind: 'crash', type: 'cymbal', x: 20, y: 20, size: 21 },
  { id: 'ride', label: 'Ride', kind: 'ride', centreKind: 'rideBell', centreLabel: 'Bell', type: 'cymbal', x: 79, y: 21, size: 24 },
  { id: 'hihat', label: 'Hi-hat', kind: 'openHat', centreKind: 'hihat', centreLabel: 'Closed', type: 'cymbal', x: 11, y: 52, size: 18 },
  { id: 'tom', label: 'Tom 1', kind: 'tom', type: 'drum', x: 40, y: 34, size: 17 },
  { id: 'tom2', label: 'Tom 2', kind: 'tom2', type: 'drum', x: 60, y: 34, size: 18 },
  { id: 'floorTom', label: 'Floor tom', kind: 'floorTom', type: 'drum', x: 86, y: 62, size: 22 },
  { id: 'snare', label: 'Snare', kind: 'snare', centreKind: 'rimshot', centreLabel: 'Rim', type: 'drum', x: 27, y: 68, size: 20 },
  { id: 'kick', label: 'Kick', kind: 'kick', type: 'drum', x: 54, y: 72, size: 30 },
];

/**
 * Sixteen electronic pads, laid out 4×4 like a sampler. Ordered so the row a
 * child starts on — kick, snare, clap, hat — is the one that makes a beat.
 */
const EPADS: { kind: EPadKind; label: string; hue: string }[] = [
  { kind: 'kick808', label: 'Kick', hue: '#ef5350' },
  { kind: 'snare808', label: 'Snare', hue: '#ffa726' },
  { kind: 'clap', label: 'Clap', hue: '#ffca28' },
  { kind: 'closedHat', label: 'Hat', hue: '#d4e157' },
  { kind: 'sub', label: 'Sub', hue: '#ec407a' },
  { kind: 'rim', label: 'Rim', hue: '#ab47bc' },
  { kind: 'openHat', label: 'Open hat', hue: '#66bb6a' },
  { kind: 'cymbal', label: 'Cymbal', hue: '#26a69a' },
  { kind: 'tomLow', label: 'Tom low', hue: '#42a5f5' },
  { kind: 'tomHigh', label: 'Tom high', hue: '#29b6f6' },
  { kind: 'cowbell', label: 'Cowbell', hue: '#8d6e63' },
  { kind: 'blip', label: 'Blip', hue: '#7e57c2' },
  { kind: 'zap', label: 'Zap', hue: '#5c6bc0' },
  { kind: 'laser', label: 'Laser', hue: '#00acc1' },
  { kind: 'noiseSweep', label: 'Sweep', hue: '#78909c' },
  { kind: 'stab', label: 'Stab', hue: '#ff7043' },
];

const BOLS: { bol: TablaBol; label: string; hint: string; side: 'dayan' | 'bayan' }[] = [
  { bol: 'na', label: 'Na', hint: 'edge', side: 'dayan' },
  { bol: 'tin', label: 'Tin', hint: 'middle', side: 'dayan' },
  { bol: 'te', label: 'Te', hint: 'flat tap', side: 'dayan' },
  { bol: 'ge', label: 'Ge', hint: 'deep', side: 'bayan' },
  { bol: 'ka', label: 'Ka', hint: 'closed', side: 'bayan' },
];

/**
 * 🎵 Music — four instruments a child can play with their fingers.
 *
 * Every sound is made on the device, so it works offline and starts the
 * instant a finger lands. Notes fire on pointer-down, never on click: waiting
 * for a full tap makes an instrument feel broken.
 */
export function MusicRoom({ instrument }: { instrument: Instrument }) {
  const [lit, setLit] = useState<string | null>(null);
  const [lastBol, setLastBol] = useState<TablaBol | null>(null);
  // `side` names whatever was struck — a tabla drum or a kit piece
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number; side: string }[]
  >([]);
  const rippleId = useRef(0);

  const [lastHit, setLastHit] = useState<string | null>(null);

  // ---------------------------------------------------------- rhythm engine

  const [recording, setRecording] = useState(false);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [playing, setPlaying] = useState(false);
  const recStart = useRef(0);
  const stopPlayback = useRef<(() => void) | null>(null);

  /** Taal loop */
  const [taalId, setTaalId] = useState<string | null>(null);
  const [tempo, setTempo] = useState(80);
  const [beatIndex, setBeatIndex] = useState(-1);

  // ------------------------------------------------------------- lessons

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [step, setStep] = useState(0);
  const [showing, setShowing] = useState(false);
  const [done, setDone] = useState(false);
  const demoTimer = useRef<number | null>(null);

  /** Plays the target and leaves it glowing — the whole instruction, wordlessly */
  const demonstrate = (l: Lesson, i: number) => {
    const t = l.steps[i];
    setShowing(true);
    if (t.midi != null) {
      if (l.instrument === 'piano') playPianoNote(t.midi, 0.9, false);
      else playXylophone(t.midi, 1);
    } else if (t.bol) {
      playTabla(t.bol);
    } else if (t.piece) {
      const piece = KIT.find((p) => p.id === t.piece);
      if (piece) playDrum(piece.kind);
    }
    demoTimer.current = window.setTimeout(() => setShowing(false), 700);
  };

  const startLesson = (l: Lesson) => {
    setLesson(l);
    setStep(0);
    setDone(false);
    window.setTimeout(() => demonstrate(l, 0), 250);
  };

  const stopLesson = () => {
    if (demoTimer.current) window.clearTimeout(demoTimer.current);
    setLesson(null);
    setDone(false);
    setShowing(false);
  };

  /** The control the child should press right now, so it can be made to glow */
  const targetNow = lesson && !done ? lesson.steps[step] : null;

  /**
   * Checks a tap against the current lesson step. A wrong tap costs nothing:
   * the target simply sounds again, so a child can explore without failing.
   */
  const lessonHeard = (action: Action) => {
    if (!lesson || done) return;
    const t = lesson.steps[step];
    const matched =
      (t.midi != null && (action.type === 'piano' || action.type === 'xylo') && action.midi === t.midi) ||
      (t.bol != null && action.type === 'tabla' && action.bol === t.bol) ||
      (t.piece != null &&
        action.type === 'drum' &&
        KIT.find((p) => p.id === t.piece)?.kind === action.kind);

    if (!matched) {
      if (demoTimer.current) window.clearTimeout(demoTimer.current);
      demoTimer.current = window.setTimeout(() => demonstrate(lesson, step), 600);
      return;
    }
    const next = step + 1;
    if (next >= lesson.steps.length) {
      setDone(true);
      window.setTimeout(() => setLesson(null), 2600);
    } else {
      setStep(next);
      window.setTimeout(() => demonstrate(lesson, next), 520);
    }
  };

  /** Copy-me game */
  const [game, setGame] = useState<'idle' | 'listen' | 'your-turn' | 'won' | 'again'>('idle');
  const target = useRef<TablaBol[]>([]);
  const answer = useRef<TablaBol[]>([]);

  /**
   * Every sound in the room goes through here, so recording, the copy-me game
   * and the instruments themselves can never drift apart: whatever a child
   * hears is exactly what gets captured.
   */
  const fire = (action: Action) => {
    perform(action);
    if (recording) {
      setBeats((prev) => [...prev, { at: Date.now() - recStart.current, action }]);
    }
    lessonHeard(action);
    if (game === 'your-turn' && action.type === 'tabla') {
      answer.current = [...answer.current, action.bol];
      const i = answer.current.length - 1;
      if (answer.current[i] !== target.current[i]) {
        setGame('again');
      } else if (answer.current.length === target.current.length) {
        setGame('won');
      }
    }
  };

  const startRecording = () => {
    setBeats([]);
    recStart.current = Date.now();
    setRecording(true);
  };

  const playRecording = () => {
    if (!beats.length) return;
    stopPlayback.current?.();
    setPlaying(true);
    const stop = playBack(beats);
    const end = window.setTimeout(() => setPlaying(false), beats[beats.length - 1].at + 900);
    stopPlayback.current = () => {
      stop();
      window.clearTimeout(end);
      setPlaying(false);
    };
  };

  // The taal loop: one timer stepping through the cycle, restarted whenever
  // the pattern or tempo changes
  useEffect(() => {
    if (!taalId) {
      setBeatIndex(-1);
      return;
    }
    const taal = TAALS.find((t) => t.id === taalId);
    if (!taal) return;
    let i = 0;
    const step = () => {
      const bol = taal.bols[i % taal.beats];
      if (bol) playTabla(bol);
      setBeatIndex(i % taal.beats);
      i += 1;
    };
    step();
    const id = window.setInterval(step, (60 / tempo) * 1000);
    return () => {
      window.clearInterval(id);
      setBeatIndex(-1);
    };
  }, [taalId, tempo]);

  // stop everything when leaving the room or changing instrument
  useEffect(() => {
    return () => {
      stopPlayback.current?.();
      setTaalId(null);
    };
  }, []);

  /** Plays a short pattern for the child to copy back */
  const startGame = () => {
    const pool: TablaBol[] = ['dha', 'tin', 'na', 'ge'];
    const length = 3 + Math.floor(Math.random() * 2); // 3 or 4 strokes
    target.current = Array.from(
      { length },
      () => pool[Math.floor(Math.random() * pool.length)],
    );
    answer.current = [];
    setGame('listen');
    target.current.forEach((bol, i) => {
      window.setTimeout(() => {
        playTabla(bol);
        setLastBol(bol);
        if (i === target.current.length - 1) {
          window.setTimeout(() => setGame('your-turn'), 700);
        }
      }, i * 620);
    });
  };

  // a readout left over from the last instrument is confusing
  useEffect(() => {
    setLastHit(null);
    setLastBol(null);
    setRipples([]);
    setLit(null);
    setChordDots(null);
    // a lesson belongs to one instrument; carrying it across would leave a
    // child hunting for a piano key on a tabla
    if (demoTimer.current) window.clearTimeout(demoTimer.current);
    setLesson(null);
    setDone(false);
    setShowing(false);
    setGame('idle');
  }, [instrument]);

  /** Play a bol, show its name, and flash the matching button */
  const sound = (bol: TablaBol) => {
    fire({ type: 'tabla', bol });
    setLastBol(bol);
  };

  /** Adds the ripple that shows exactly where a drum was struck */
  const ripple = (x: number, y: number, side: string) => {
    const id = rippleId.current++;
    setRipples((prev) => [...prev.slice(-6), { id, x, y, side }]);
    window.setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 500);
  };

  const [sustain, setSustain] = useState(false);

  /**
   * Pressing a piano key. A tablet can't measure how fast a finger falls, so
   * position stands in for it: the front of the key — where a player's hand
   * naturally lands for a firm note — is loud, the back is soft.
   */
  const pressKey = (e: React.PointerEvent, midi: number, id: string) => {
    e.preventDefault();
    const box = e.currentTarget.getBoundingClientRect();
    const down = (e.clientY - box.top) / box.height; // 0 at the back, 1 at the front
    const velocity = 0.4 + Math.min(1, Math.max(0, down)) * 0.6;

    fire({ type: 'piano', midi, velocity, sustain });
    setLastHit(`${noteName(midi)}  ${Math.round(velocity * 127)}`);
    setLit(id);
    window.setTimeout(() => setLit((k) => (k === id ? null : k)), 190);
  };

  // ------------------------------------------------------------ tambourine

  const [shaking, setShaking] = useState(false);
  const [jingling, setJingling] = useState(false);
  const lastShake = useRef({ x: 0, y: 0, at: 0 });

  const flashJingles = () => {
    setJingling(true);
    window.setTimeout(() => setJingling(false), 220);
  };

  /** Middle of the frame is the skin; the wooden rim is all jingle */
  const strikeTambourine = (e: React.PointerEvent) => {
    e.preventDefault();
    const box = e.currentTarget.getBoundingClientRect();
    const radius =
      Math.hypot(e.clientX - box.left - box.width / 2, e.clientY - box.top - box.height / 2) /
      (box.width / 2);
    const hit = radius > 0.66 ? 'rim' : 'head';
    fire({ type: 'tambourine', hit, velocity: 1 });
    setLastHit(hit === 'rim' ? 'jingle' : 'thump');
    flashJingles();
    lastShake.current = { x: e.clientX, y: e.clientY, at: performance.now() };
  };

  /**
   * Dragging is shaking. How fast the finger moves sets how hard the jingles
   * rattle, and a slow drag makes almost nothing — the same as a real one.
   */
  const shakeFrom = (e: React.PointerEvent) => {
    const now = performance.now();
    const prev = lastShake.current;
    const dt = now - prev.at;
    if (dt < 45) return;
    const distance = Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
    lastShake.current = { x: e.clientX, y: e.clientY, at: now };
    if (distance < 14) return;

    const speed = Math.min(1, distance / 90);
    fire({ type: 'tambourine', hit: 'shake', velocity: 0.3 + speed * 0.7 });
    setLastHit('shake');
    setShaking(true);
    flashJingles();
  };

  const [tuningId, setTuningId] = useState(TUNINGS[0].id);
  const tuning = TUNINGS.find((t) => t.id === tuningId) ?? TUNINGS[0];
  const tines = layout(tuning.notes);

  /** Kalimbas are stamped with numbers; sargam is the same idea, in a notation a child here already meets */
  const sargamFor = (midi: number) => SARGAM[[0, 2, 4, 5, 7, 9, 11].indexOf(midi % 12)] ?? '';

  /**
   * Flicking a tine. Near the tip it is free to vibrate and gives the full
   * note; down by the bridge it is stiff, so a real kalimba answers with a
   * dull tick — the same "aim for the sweet spot" idea as the xylophone bars.
   */
  const strikeTine = (e: React.PointerEvent, midi: number) => {
    e.preventDefault();
    e.stopPropagation();
    const box = e.currentTarget.getBoundingClientRect();
    // tines hang downwards: the tip is the top of the button
    const along = (e.clientY - box.top) / box.height;
    const tip = Math.max(0.15, 1 - along);

    fire({ type: 'kalimba', midi, strike: tip });
    setLastHit(`${noteName(midi)}${tip < 0.4 ? '  (bridge)' : ''}`);
    setLit(`k${midi}`);
    window.setTimeout(() => setLit((k) => (k === `k${midi}` ? null : k)), 200);
  };

  const [scaleId, setScaleId] = useState(HANDPAN_SCALES[0].id);
  const scale = HANDPAN_SCALES.find((s) => s.id === scaleId) ?? HANDPAN_SCALES[0];

  // -------------------------------------------------------- calm listening

  const [droneHz, setDroneHz] = useState<number | null>(null);
  const [tuningRef, setTuningRef] = useState(440);
  const [drifting, setDrifting] = useState(false);
  const stopDrone = useRef<(() => void) | null>(null);

  useEffect(() => {
    setTuningA(tuningRef);
  }, [tuningRef]);

  // the drone itself, faded in and out rather than switched
  useEffect(() => {
    if (droneHz == null) return;
    const stop = startDrone(droneHz);
    stopDrone.current = stop;
    return () => {
      stop();
      stopDrone.current = null;
    };
  }, [droneHz]);

  /**
   * "Drifting": the pan plays itself, one soft note every few seconds, in no
   * pattern. It is meant to be listened to rather than played — a child who
   * is overwhelmed can put the tablet down and let it go on quietly.
   */
  useEffect(() => {
    if (!drifting) return;
    let timer = 0;
    const next = () => {
      const pool = [scale.ding, ...scale.fields];
      const midi = pool[Math.floor(Math.random() * pool.length)];
      playHandpan(midi, 0.55 + Math.random() * 0.35);
      timer = window.setTimeout(next, 2600 + Math.random() * 3200);
    };
    timer = window.setTimeout(next, 1200);
    return () => window.clearTimeout(timer);
  }, [drifting, scale]);

  // leaving the music room must not leave a drone playing
  useEffect(() => {
    return () => {
      stopDrone.current?.();
    };
  }, []);

  /**
   * Striking a tone field. The middle gives the full singing note; the edge
   * of a field gives the brighter, shorter ping a player uses for accents —
   * so one dent is really two sounds.
   */
  const strikePan = (e: React.PointerEvent, midi: number, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const radius = Math.hypot(x - box.width / 2, y - box.height / 2) / (box.width / 2);
    const centre = Math.max(0.15, 1 - radius);

    fire({ type: 'handpan', midi, strike: centre });
    setLastHit(`${noteName(midi)}${centre < 0.45 ? '  (edge)' : ''}`);
    setLit(id);
    window.setTimeout(() => setLit((k) => (k === id ? null : k)), 260);
  };

  /**
   * Striking a xylophone bar. How far along the bar the mallet lands decides
   * the tone: the middle sings, the ends are nodes and barely sound.
   */
  const strikeBar = (e: React.PointerEvent, midi: number) => {
    e.preventDefault();
    const box = e.currentTarget.getBoundingClientRect();
    // 1 in the middle of the bar's length, 0 at either end
    const along = (e.clientY - box.top) / box.height;
    const centre = 1 - Math.abs(along - 0.5) * 2;

    fire({ type: 'xylo', midi, strike: centre });
    setLastHit(`${noteName(midi)}${centre < 0.35 ? '  (edge)' : ''}`);
    setLit(`x${midi}`);
    window.setTimeout(() => setLit((k) => (k === `x${midi}` ? null : k)), 170);
  };

  /** Fret positions currently shown on the neck, after a chord is pressed */
  const [chordDots, setChordDots] = useState<(number | null)[] | null>(null);

  /**
   * Strums a chord *and* shows where the fingers go. The notes are derived
   * from the same shape that lights the dots, so what a child sees and what
   * they hear can never drift apart.
   */
  const playChord = (chord: { name: string; shape: (number | null)[] }) => {
    const midis = chord.shape
      .map((fret, i) => (fret == null ? null : STRINGS[i].midi + fret))
      .filter((m): m is number => m != null);
    fire({ type: 'strum', midis, direction: 'down' });
    setLastHit(`${chord.name}  chord`);
    setChordDots(chord.shape);
    window.setTimeout(() => setChordDots(null), 2600);
  };

  /**
   * A sampler pad reads how hard it was struck. There is no pressure sensor
   * on a tablet, so the middle of the pad counts as a hard hit and the edges
   * as a soft one — the same gesture a drummer already makes, and it gives a
   * child something to control beyond on/off.
   */
  const hitPad = (e: React.PointerEvent, kind: EPadKind, label: string) => {
    e.preventDefault();
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const radius = Math.hypot(x - box.width / 2, y - box.height / 2) / (box.width / 2);
    // some tablets do report real pressure — use it when it is there
    const velocity =
      e.pressure > 0 && e.pressure < 1
        ? 0.4 + e.pressure * 0.6
        : Math.max(0.35, 1 - radius * 0.55);

    fire({ type: 'epad', kind, velocity });
    setLastHit(`${label.toUpperCase()}  ${Math.round(velocity * 127)}`);
    setLit(kind);
    window.setTimeout(() => setLit((k) => (k === kind ? null : k)), 150);
    ripple((x / box.width) * 100, (y / box.height) * 100, kind);
  };

  /**
   * Striking a kit piece. The middle of a snare, ride or hi-hat is a different
   * stroke from its edge, so the same rule as the tabla applies: distance from
   * the centre picks the sound.
   */
  const hitPiece = (e: React.PointerEvent, piece: Piece) => {
    e.preventDefault();
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const radius = Math.hypot(x - box.width / 2, y - box.height / 2) / (box.width / 2);

    const centre = piece.centreKind && radius < 0.45;
    fire({ type: 'drum', kind: centre ? piece.centreKind! : piece.kind });
    setLastHit(centre ? `${piece.label} · ${piece.centreLabel}` : piece.label);
    setLit(piece.id);
    window.setTimeout(() => setLit((k) => (k === piece.id ? null : k)), 160);
    ripple((x / box.width) * 100, (y / box.height) * 100, piece.id);
  };

  /**
   * Where the finger lands decides the stroke, exactly as on a real tabla:
   * the kinar (rim), the maidan (open skin) and the syahi (the black circle)
   * each answer differently. Distance from the centre is all it takes.
   */
  const strike = (e: React.PointerEvent, side: 'dayan' | 'bayan') => {
    e.preventDefault();
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    // 0 at the centre, 1 at the rim
    const radius =
      Math.hypot(x - box.width / 2, y - box.height / 2) / (box.width / 2);

    const bol: TablaBol =
      side === 'dayan'
        ? radius > 0.72
          ? 'na' // kinar — bright ring off the rim
          : radius > 0.36
            ? 'tin' // maidan — the open, singing stroke
            : 'te' // syahi — flat, damped tap
        : radius > 0.55
          ? 'ka' // bayan rim — closed slap
          : 'ge'; // bayan centre — the deep open boom

    sound(bol);
    setLit(bol);
    window.setTimeout(() => setLit((k) => (k === bol ? null : k)), 180);
    ripple((x / box.width) * 100, (y / box.height) * 100, side);
  };

  const hit = (key: string, play: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      play();
      setLit(key);
      window.setTimeout(() => setLit((k) => (k === key ? null : k)), 180);
    },
  });

  const taal = TAALS.find((t) => t.id === taalId);
  const myLessons = lessonsFor(instrument);

  /**
   * Lessons, shown wordlessly: a row of pictures to choose from, then dots
   * for where you are. The glowing key is the instruction.
   */
  const lessonBar = myLessons.length > 0 && (
    <div className={`lesson-bar ${lesson ? 'lesson-live' : ''}`}>
      {!lesson ? (
        <>
          <span className="lesson-cta" aria-hidden="true">🎓</span>
          {myLessons.map((l) => (
            <button
              key={l.id}
              className="lesson-chip"
              onClick={() => startLesson(l)}
              aria-label={`Lesson: ${l.title}`}
            >
              <span className="lesson-emoji" aria-hidden="true">{l.emoji}</span>
              <span>{l.title}</span>
            </button>
          ))}
        </>
      ) : done ? (
        <div className="lesson-done" role="status">
          <span aria-hidden="true">🎉</span> {lesson.title}
        </div>
      ) : (
        <>
          <span className="lesson-emoji" aria-hidden="true">{lesson.emoji}</span>
          <div className="lesson-dots" aria-label={`Step ${step + 1} of ${lesson.steps.length}`}>
            {lesson.steps.map((_, i) => (
              <span
                key={i}
                className={`lesson-dot ${i < step ? 'dot-done' : ''} ${
                  i === step ? 'dot-now' : ''
                }`}
              />
            ))}
          </div>
          {/* an ear while the app plays, a hand when it is the child's turn */}
          <span className="lesson-cue" aria-hidden="true">{showing ? '👂' : '👆'}</span>
          <button className="t-btn" onClick={() => demonstrate(lesson, step)}>
            🔁 Again
          </button>
          <button className="t-btn" onClick={stopLesson} aria-label="End lesson">
            ✖
          </button>
        </>
      )}
    </div>
  );

  /** Record, play back, loop a taal, and the copy-me game — for every instrument */
  const transport = (
    <div className="transport">
      <div className="transport-row">
        <button
          className={`t-btn ${recording ? 't-rec' : ''}`}
          onClick={() => (recording ? setRecording(false) : startRecording())}
        >
          {recording ? '⏹ Stop' : '⏺ Record'}
        </button>
        <button
          className="t-btn"
          disabled={!beats.length || recording}
          onClick={() => (playing ? stopPlayback.current?.() : playRecording())}
        >
          {playing ? '⏸ Stop' : '▶️ Play'}
        </button>
        <button
          className="t-btn"
          disabled={!beats.length || recording}
          onClick={() => {
            stopPlayback.current?.();
            setBeats([]);
          }}
        >
          🗑️ Clear
        </button>
        <span className="t-count">
          {recording ? 'recording…' : beats.length ? `${beats.length} notes` : 'nothing yet'}
        </span>
      </div>

      <div className="transport-row">
        <span className="t-label">Taal</span>
        {TAALS.map((t) => (
          <button
            key={t.id}
            className={`t-btn ${taalId === t.id ? 't-on' : ''}`}
            onClick={() => setTaalId(taalId === t.id ? null : t.id)}
          >
            {t.name}
            <small>{t.beats}</small>
          </button>
        ))}
        <label className="t-tempo">
          {tempo} bpm
          <input
            type="range"
            min={40}
            max={160}
            step={5}
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
          />
        </label>
      </div>

      {taal && (
        <div className="taal-strip" aria-label={`${taal.name} cycle`}>
          {taal.spoken.map((name, i) => (
            <span
              key={i}
              className={`taal-beat ${i === beatIndex ? 'taal-now' : ''} ${
                i === taal.sam ? 'taal-sam' : ''
              } ${taal.khali?.includes(i) ? 'taal-khali' : ''}`}
            >
              {name}
            </span>
          ))}
        </div>
      )}

      <div className="transport-row">
        <button className="t-btn t-game" onClick={startGame}>
          🎧 Copy me
        </button>
        <span className="t-status">
          {game === 'listen' && 'Listen…'}
          {game === 'your-turn' && `Your turn — ${target.current.length} strokes on the tabla`}
          {game === 'won' && '🎉 Exactly right!'}
          {game === 'again' && 'Not quite — tap Copy me to hear it again'}
          {game === 'idle' && 'I play a rhythm, you copy it on the tabla'}
        </span>
      </div>
    </div>
  );

  // The instrument is chosen in the app's left navigation, alongside the
  // Write tab's tracing sets — this component is just the stage.
  return (
    <main className="music">
      {instrument === 'piano' && (
        <>
          <p className="music-hint">
            Press near the <b>front</b> of a key for a loud note, near the back
            for a soft one. Hold the pedal to let them ring.
          </p>

          <div className="piano-case">
            <div className="piano-fallboard">
              <span className="piano-brand">MTalk</span>
              <button
                className={`pedal ${sustain ? 'pedal-down' : ''}`}
                aria-pressed={sustain}
                onClick={() => setSustain((s) => !s)}
              >
                🦶 Pedal {sustain ? 'ON' : 'OFF'}
              </button>
              <span className="piano-readout" aria-live="polite">
                {lastHit ?? '· · ·'}
              </span>
            </div>
            <span className="piano-felt" aria-hidden="true" />

            <div className="piano">
              <div className="piano-whites">
                {WHITE_KEYS.map((k, i) => (
                  <button
                    key={`w${k.midi}-${i}`}
                    className={`piano-white ${lit === `w${i}` ? 'key-down' : ''} ${
                      targetNow?.midi === k.midi ? 'lesson-target' : ''
                    }`}
                    aria-label={`${k.sargam} ${k.letter}`}
                    onPointerEnter={(e) => e.buttons > 0 && pressKey(e, k.midi, `w${i}`)}
                    onPointerDown={(e) => pressKey(e, k.midi, `w${i}`)}
                  >
                    <span className="piano-sargam">{k.sargam}</span>
                    <span className="piano-letter">{k.letter}</span>
                  </button>
                ))}
              </div>
              <div className="piano-blacks">
                {BLACK_KEYS.map((k) => (
                  <button
                    key={k.midi}
                    className={`piano-black ${lit === `b${k.midi}` ? 'key-down' : ''} ${
                      targetNow?.midi === k.midi ? 'lesson-target' : ''
                    }`}
                    style={{ left: `calc(${((k.after + 1) * 100) / WHITE_KEYS.length}% - 2.6%)` }}
                    aria-label={noteName(k.midi)}
                    onPointerEnter={(e) => e.buttons > 0 && pressKey(e, k.midi, `b${k.midi}`)}
                    onPointerDown={(e) => pressKey(e, k.midi, `b${k.midi}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {instrument === 'xylophone' && (
        <>
          <p className="music-hint">
            Hit the <b>middle</b> of a bar for the fullest note — the ends barely
            ring, just like the real thing. Drag across for a glissando.
          </p>

          <div className="xylo">
            {/* sharps in their own row above — never overlapping the naturals,
                so their labels stay readable */}
            <div className="xylo-sharps">
              {XYLO_SHARPS.map((bar) => (
                <button
                  key={bar.midi}
                  className={`xylo-bar xylo-sharp ${lit === `x${bar.midi}` ? 'bar-struck' : ''}`}
                  style={{
                    left: `${((bar.after + 1) * 100) / XYLO_NATURALS.length}%`,
                    height: `${94 - bar.after * 2.4}%`,
                  }}
                  aria-label={bar.letter}
                  onPointerEnter={(e) => e.buttons > 0 && strikeBar(e, bar.midi)}
                  onPointerDown={(e) => strikeBar(e, bar.midi)}
                >
                  <span className="xylo-note xylo-note-sharp">{bar.letter}</span>
                  <span className="xylo-cord" aria-hidden="true" />
                </button>
              ))}
            </div>

            {/* naturals along the front */}
            <div className="xylo-naturals">
              {XYLO_NATURALS.map((bar, i) => (
                <button
                  key={bar.midi}
                  className={`xylo-bar ${lit === `x${bar.midi}` ? 'bar-struck' : ''} ${
                    targetNow?.midi === bar.midi ? 'lesson-target' : ''
                  }`}
                  style={{
                    background: `linear-gradient(180deg, ${bar.color}, color-mix(in srgb, ${bar.color} 70%, #000))`,
                    // bars shorten as they rise, as on a real instrument
                    height: `${100 - i * 2.6}%`,
                  }}
                  aria-label={`${bar.sargam} ${bar.letter}`}
                  onPointerEnter={(e) => e.buttons > 0 && strikeBar(e, bar.midi)}
                  onPointerDown={(e) => strikeBar(e, bar.midi)}
                >
                  <span className="xylo-cord" aria-hidden="true" />
                  <span className="xylo-note">
                    {bar.sargam}
                    <small>{bar.letter}</small>
                  </span>
                  <span className="xylo-cord" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          <div className="tabla-readout" aria-live="polite">
            {lastHit ?? '· · ·'}
          </div>
        </>
      )}

      {instrument === 'tambourine' && (
        <>
          <p className="music-hint">
            Tap the <b>middle</b> for a thump, the <b>wooden rim</b> for a
            jingle — or drag across it to shake.
          </p>

          <div
            className={`tamb ${shaking ? 'tamb-shaking' : ''}`}
            onPointerDown={(e) => strikeTambourine(e)}
            onPointerMove={(e) => {
              // a finger dragged across is a shake, at the speed you drag
              if (e.buttons > 0) shakeFrom(e);
            }}
            onPointerUp={() => setShaking(false)}
            onPointerLeave={() => setShaking(false)}
          >
            <span className="tamb-frame" aria-hidden="true" />
            <span className="tamb-head" aria-hidden="true" />
            <span className="tamb-thumb" aria-hidden="true" />

            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i * 360) / 8;
              return (
                <span
                  key={i}
                  className="tamb-slot"
                  style={{ transform: `rotate(${angle}deg) translateY(-42%)` }}
                  aria-hidden="true"
                >
                  <span className={`zil zil-a ${jingling ? 'zil-shiver' : ''}`} />
                  <span className={`zil zil-b ${jingling ? 'zil-shiver' : ''}`} />
                </span>
              );
            })}
          </div>

          <div className="tabla-readout" aria-live="polite">
            {lastHit ?? '· · ·'}
          </div>
        </>
      )}

      {instrument === 'kalimba' && (
        <>
          <p className="music-hint">
            Flick a tine near its <b>tip</b> for a full note. The longest tine
            in the middle is the lowest — the notes climb outwards.
          </p>

          <div className="pan-scales">
            {TUNINGS.map((t) => (
              <button
                key={t.id}
                className={`t-btn ${tuning.id === t.id ? 't-on' : ''}`}
                onClick={() => setTuningId(t.id)}
                title={t.note}
              >
                {t.name}
              </button>
            ))}
          </div>

          <div
            className="kalimba"
            onPointerDown={(e) => {
              // the bare wood is a knock, not a note
              if (e.target === e.currentTarget) {
                playWoodKnock();
                setLastHit('knock');
              }
            }}
          >
            <span className="kal-hole" aria-hidden="true" />
            <span className="kal-bridge" aria-hidden="true" />

            <div className="kal-tines">
              {[...tines]
                .sort((a, b) => a.slot - b.slot)
                .map((tine) => (
                  <button
                    key={tine.midi}
                    className={`kal-tine ${lit === `k${tine.midi}` ? 'kal-ping' : ''}`}
                    style={{ height: `${tine.length * 100}%` }}
                    aria-label={noteName(tine.midi)}
                    onPointerEnter={(e) => e.buttons > 0 && strikeTine(e, tine.midi)}
                    onPointerDown={(e) => strikeTine(e, tine.midi)}
                  >
                    <span className="kal-metal" aria-hidden="true" />
                    <span className="kal-num">{sargamFor(tine.midi)}</span>
                  </button>
                ))}
            </div>
          </div>

          <div className="tabla-readout" aria-live="polite">
            {lastHit ?? '· · ·'}
          </div>
        </>
      )}

      {instrument === 'handpan' && (
        <>
          <p className="music-hint">
            Tap the dents with the flat of a finger. Every note belongs to the
            same scale, so nothing you play can sound wrong.
          </p>

          <div className="pan-scales">
            {HANDPAN_SCALES.map((s) => (
              <button
                key={s.id}
                className={`t-btn ${scale.id === s.id ? 't-on' : ''}`}
                onClick={() => setScaleId(s.id)}
                title={s.mood}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div
            className="pan"
            // the rim between the fields is the shell — a dry slap, not a note
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) {
                playHandpanSlap();
                setLastHit('slap');
              }
            }}
          >
            <span className="pan-shell" aria-hidden="true" />

            <button
              className={`pan-field pan-ding ${lit === 'ding' ? 'pan-ring' : ''}`}
              aria-label={`Ding — ${noteName(scale.ding)}`}
              onPointerDown={(e) => strikePan(e, scale.ding, 'ding')}
            >
              <span className="pan-dimple" aria-hidden="true" />
              <span className="pan-name">{noteName(scale.ding)}</span>
            </button>

            {scale.fields.map((midi, i) => {
              // Fields alternate side to side as they climb, as on a real
              // shell. The spacing and the sizes are set together: 36° apart
              // on a 36% radius leaves a 22% gap between centres, which the
              // dents (21% wide, shrinking as they rise) sit inside without
              // touching.
              const side = i % 2 === 0 ? -1 : 1;
              const rank = Math.floor(i / 2);
              const angle = side * (40 + rank * 36);
              const radius = 36;
              const size = 21 - rank * 1.2;
              const x = 50 + Math.sin((angle * Math.PI) / 180) * radius;
              const y = 50 - Math.cos((angle * Math.PI) / 180) * radius;
              return (
                <button
                  key={`${midi}-${i}`}
                  className={`pan-field ${lit === `p${i}` ? 'pan-ring' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%`, width: `${size}%` }}
                  aria-label={noteName(midi)}
                  onPointerEnter={(e) => e.buttons > 0 && strikePan(e, midi, `p${i}`)}
                  onPointerDown={(e) => strikePan(e, midi, `p${i}`)}
                >
                  <span className="pan-dimple" aria-hidden="true" />
                  <span className="pan-name">{noteName(midi)}</span>
                </button>
              );
            })}
          </div>

          <div className="tabla-readout" aria-live="polite">
            {lastHit ?? '· · ·'}
          </div>

          <div className="calm">
            <div className="calm-row">
              <span className="calm-title">🌙 Calm listening</span>
              <button
                className={`t-btn ${drifting ? 't-on' : ''}`}
                onClick={() => setDrifting((d) => !d)}
              >
                {drifting ? '⏹ Stop' : '▶️ Play by itself'}
              </button>
            </div>

            <div className="calm-row">
              <span className="calm-label">Low drone</span>
              {DRONES.map((d) => (
                <button
                  key={d.hz}
                  className={`t-btn ${droneHz === d.hz ? 't-on' : ''}`}
                  title={d.label}
                  onClick={() => setDroneHz(droneHz === d.hz ? null : d.hz)}
                >
                  {d.hz} Hz
                </button>
              ))}
            </div>

            <div className="calm-row">
              <span className="calm-label">Tuning</span>
              {TUNING_REFS.map((hz) => (
                <button
                  key={hz}
                  className={`t-btn ${tuningRef === hz ? 't-on' : ''}`}
                  onClick={() => setTuningRef(hz)}
                >
                  A={hz}
                </button>
              ))}
              <span className="calm-note">
                Tuning shifts every note a little up or down — a matter of
                taste, like a warmer speaker. It does not change how a child
                thinks or feels, and nothing here is a treatment.
              </span>
            </div>
          </div>
        </>
      )}

      {instrument === 'guitar' && (
        <>
          <p className="music-hint">
            Press a string on the neck to play that note, or strum across the
            sound hole. A chord button shows you where the fingers go.
          </p>

          <div className="guitar">
            <div className="guitar-head" aria-hidden="true">
              {STRINGS.map((s, i) => (
                <span key={s.midi} className={`guitar-peg peg-${i}`} />
              ))}
            </div>

            <div className="guitar-neck">
              <span className="guitar-nut" aria-hidden="true" />
              {Array.from({ length: FRETS }, (_, f) => (
                <span
                  key={f}
                  className="guitar-fret"
                  style={{ left: `${((f + 1) * 100) / FRETS}%` }}
                  aria-hidden="true"
                />
              ))}
              {/* position inlays at the 3rd and 5th fret */}
              {[2, 4].map((f) => (
                <span
                  key={f}
                  className="guitar-inlay"
                  style={{ left: `${((f + 0.5) * 100) / FRETS}%` }}
                  aria-hidden="true"
                />
              ))}

              {/* one row per string, each split into frets you can press */}
              {STRINGS.map((s, i) => (
                <div key={s.midi} className="fret-row">
                  {Array.from({ length: FRETS }, (_, f) => {
                    const fret = f + 1;
                    const midi = s.midi + fret;
                    const shown = chordDots?.[i] === fret;
                    return (
                      <button
                        key={fret}
                        className={`fret-cell ${shown ? 'fret-dot' : ''} ${
                          lit === `f${i}-${fret}` ? 'fret-lit' : ''
                        }`}
                        aria-label={`${s.name} string, fret ${fret} — ${noteName(midi)}`}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          fire({ type: 'pluck', midi });
                          setLastHit(noteName(midi));
                          setLit(`f${i}-${fret}`);
                          window.setTimeout(
                            () => setLit((k) => (k === `f${i}-${fret}` ? null : k)),
                            200,
                          );
                        }}
                      >
                        <span className="fret-wire" style={{ height: `${5 - i * 0.5}px` }} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* body: strum the open strings across the sound hole */}
            <div className="guitar-body">
              <span className="guitar-hole" aria-hidden="true" />
              <span className="guitar-bridge" aria-hidden="true" />
              <div className="strum-zone">
                {STRINGS.map((s, i) => (
                  <button
                    key={s.midi}
                    className={`strum-string ${lit === `s${i}` ? 'string-ringing' : ''}`}
                    aria-label={`Strum ${s.name} string`}
                    onPointerEnter={(e) => {
                      if (e.buttons > 0 || e.pressure > 0) {
                        fire({ type: 'pluck', midi: s.midi });
                        setLastHit(noteName(s.midi));
                        setLit(`s${i}`);
                      }
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      fire({ type: 'pluck', midi: s.midi });
                      setLastHit(noteName(s.midi));
                      setLit(`s${i}`);
                      window.setTimeout(() => setLit((k) => (k === `s${i}` ? null : k)), 200);
                    }}
                  >
                    <span
                      className="guitar-string-wire"
                      style={{ '--thickness': `${6 - i * 0.7}px` } as React.CSSProperties}
                    />
                    <span className="guitar-string-name">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="tabla-readout" aria-live="polite">
            {lastHit ?? '· · ·'}
          </div>

          <div className="chord-row">
            {CHORDS.map((c) => (
              <button
                key={c.name}
                className={`chord ${lit === `c${c.name}` ? 'key-lit' : ''}`}
                {...hit(`c${c.name}`, () => playChord(c))}
              >
                {c.name}
              </button>
            ))}
            <button
              className={`chord chord-up ${lit === 'up' ? 'key-lit' : ''}`}
              {...hit('up', () => {
                fire({ type: 'strum', midis: STRINGS.map((s) => s.midi), direction: 'up' });
                setLastHit('STRUM ↑');
              })}
            >
              ↑ Up
            </button>
          </div>
        </>
      )}

      {instrument === 'drums' && (
        <>
          <p className="music-hint">
            Hit the middle of the snare for a <b>rim</b>, the middle of the ride
            for its <b>bell</b>, the middle of the hi-hat to <b>close</b> it.
          </p>

          <div className="kit">
            {KIT.map((p) => (
              <button
                key={p.id}
                className={`kit-piece kit-${p.type} kit-${p.id} ${
                  lit === p.id ? 'kit-struck' : ''
                } ${targetNow?.piece === p.id ? 'lesson-target' : ''}`}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.size}%`,
                }}
                aria-label={
                  p.centreLabel ? `${p.label}, middle for ${p.centreLabel}` : p.label
                }
                onPointerDown={(e) => hitPiece(e, p)}
              >
                <span className="kit-face" aria-hidden="true" />
                {p.type === 'drum' && <span className="kit-lugs" aria-hidden="true" />}
                <span className="kit-label">
                  {p.label}
                  {p.centreLabel && <small>middle: {p.centreLabel}</small>}
                </span>
                {ripples
                  .filter((r) => r.side === p.id)
                  .map((r) => (
                    <span
                      key={r.id}
                      className="kit-ripple"
                      style={{ left: `${r.x}%`, top: `${r.y}%` }}
                    />
                  ))}
              </button>
            ))}
          </div>

          <div className="tabla-readout" aria-live="polite">
            {lastHit ? lastHit.toUpperCase() : '· · ·'}
          </div>
        </>
      )}

      {instrument === 'epads' && (
        <>
          <p className="music-hint">
            Top row makes a beat: Kick · Snare · Clap · Hat. Several fingers at once.
          </p>
          <div className="epad-unit">
            <div className="epad-brand">
              <span className="epad-led" aria-hidden="true" />
              <span>MTALK · 16 PAD</span>
              <span className="epad-screen" aria-live="polite">
                {lastHit ?? 'READY'}
              </span>
            </div>

            <div className="epads">
              {EPADS.map((p) => (
                <button
                  key={p.kind}
                  className={`epad ${lit === p.kind ? 'epad-hit' : ''}`}
                  style={{ '--hue': p.hue } as React.CSSProperties}
                  aria-label={`${p.label} — hit the middle harder`}
                  onPointerDown={(e) => hitPad(e, p.kind, p.label)}
                >
                  <span className="epad-face" aria-hidden="true" />
                  <span className="epad-name">{p.label}</span>
                  {ripples
                    .filter((r) => r.side === p.kind)
                    .map((r) => (
                      <span
                        key={r.id}
                        className="kit-ripple"
                        style={{ left: `${r.x}%`, top: `${r.y}%` }}
                      />
                    ))}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {instrument === 'tabla' && (
        <>
          <p className="music-hint">
            Strike the drums where a player would: the <b>edge</b>, the{' '}
            <b>middle</b>, or the <b>black circle</b>. Both hands at once is{' '}
            <b>Dha</b>.
          </p>

          <div className="tabla">
            {(['bayan', 'dayan'] as const).map((side) => (
              <div key={side} className={`tabla-set tabla-set-${side}`}>
                <div
                  className={`tabla-head tabla-head-${side}`}
                  role="button"
                  tabIndex={0}
                  aria-label={
                    side === 'dayan'
                      ? 'Dayan — edge is Na, middle is Tin, centre is Te'
                      : 'Bayan — centre is Ge, edge is Ka'
                  }
                  onPointerDown={(e) => strike(e, side)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      sound(side === 'dayan' ? 'na' : 'ge');
                    }
                  }}
                >
                  {/* the head, from the rim inwards */}
                  <span className="tabla-kinar" aria-hidden="true" />
                  <span className="tabla-maidan" aria-hidden="true" />
                  <span className="tabla-syahi" aria-hidden="true" />
                  <span className="tabla-zone-label tabla-zone-outer" aria-hidden="true">
                    {side === 'dayan' ? 'Na' : 'Ka'}
                  </span>
                  {side === 'dayan' && (
                    <span className="tabla-zone-label tabla-zone-mid" aria-hidden="true">
                      Tin
                    </span>
                  )}
                  <span className="tabla-zone-label tabla-zone-inner" aria-hidden="true">
                    {side === 'dayan' ? 'Te' : 'Ge'}
                  </span>

                  {ripples
                    .filter((r) => r.side === side)
                    .map((r) => (
                      <span
                        key={r.id}
                        className="tabla-ripple"
                        style={{ left: `${r.x}%`, top: `${r.y}%` }}
                      />
                    ))}
                </div>
                <span className="tabla-name">
                  {side === 'dayan' ? 'Dayan' : 'Bayan'}
                  <small>{side === 'dayan' ? 'right · treble' : 'left · bass'}</small>
                </span>
              </div>
            ))}
          </div>

          {/* what was just played, so a child hears and reads the bol together */}
          <div className="tabla-readout" aria-live="polite">
            {lastBol ? lastBol.toUpperCase() : '· · ·'}
          </div>

          <div className="tabla-bols">
            {BOLS.map((b) => (
              <button
                key={b.bol}
                className={`bol ${lit === b.bol ? 'key-lit' : ''} ${
                  targetNow?.bol === b.bol ? 'lesson-target' : ''
                }`}
                {...hit(b.bol, () => sound(b.bol))}
              >
                {b.label}
                <small>{b.hint}</small>
              </button>
            ))}
            <button
              className={`bol bol-dha ${lit === 'dha' ? 'key-lit' : ''} ${
                targetNow?.bol === 'dha' ? 'lesson-target' : ''
              }`}
              {...hit('dha', () => sound('dha'))}
            >
              Dha <small>both hands</small>
            </button>
          </div>
        </>
      )}

      {lessonBar}
      {transport}
    </main>
  );
}
