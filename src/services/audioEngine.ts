/**
 * Instrument sounds, synthesised in the browser.
 *
 * No sample files: an AAC app that works with the WiFi off shouldn't need to
 * download a megabyte of piano notes, and a child on a cheap tablet shouldn't
 * wait for them. Everything here is oscillators, noise and envelopes, so the
 * whole music room costs nothing to ship and starts instantly.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/** Created on the first tap — browsers refuse audio before a gesture */
function audio(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
  }
  // A tab restored from the background comes back suspended
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

const out = (): GainNode => {
  audio();
  return master!;
};

/**
 * Concert pitch. 440 Hz is the standard; 432 and 444 are alternative tunings
 * some players prefer the sound of.
 *
 * To be clear about what this does: it shifts every note very slightly up or
 * down — 432 is about a third of a semitone flat of 440. It is a matter of
 * taste, like preferring a warmer speaker. There is no evidence that any of
 * these tunings affects a child's brain, mood or attention, and the app does
 * not claim they do.
 */
let tuningA = 440;
export const setTuningA = (hz: number) => {
  tuningA = hz;
};
export const getTuningA = () => tuningA;

/** MIDI note number → Hz (A4 = 69) */
export const noteFreq = (midi: number) => tuningA * Math.pow(2, (midi - 69) / 12);

/**
 * A quiet, slowly-swelling drone.
 *
 * Everything here is chosen so it can't startle: a three-second fade in, no
 * attack transient, a gentle low-pass, and a level well under the instruments.
 * Returns a stop function that fades out rather than cutting.
 */
export function startDrone(hz: number, level = 0.09): () => void {
  const c = audio();
  const now = c.currentTime;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(level, now + 3);

  const warm = c.createBiquadFilter();
  warm.type = 'lowpass';
  warm.frequency.value = Math.max(hz * 6, 400);

  // two oscillators a few cents apart give a slow, soft beating
  const oscs = [-4, 4].map((detune) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = hz;
    osc.detune.value = detune;
    osc.connect(warm);
    osc.start(now);
    return osc;
  });
  // a quiet octave above keeps it from sounding like a hum
  const upper = c.createOscillator();
  upper.type = 'sine';
  upper.frequency.value = hz * 2;
  const upperGain = c.createGain();
  upperGain.gain.value = 0.3;
  upper.connect(upperGain).connect(warm);
  upper.start(now);

  warm.connect(gain).connect(out());

  return () => {
    const end = c.currentTime;
    gain.gain.cancelScheduledValues(end);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), end);
    gain.gain.exponentialRampToValueAtTime(0.0001, end + 2);
    [...oscs, upper].forEach((o) => o.stop(end + 2.1));
  };
}

function noiseBuffer(c: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(c.sampleRate * seconds);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// ------------------------------------------------------------------- piano

/**
 * Two detuned oscillators with a struck-string envelope. Not a Steinway, but
 * it starts the instant a finger lands, which is what matters to a child.
 */
export function playPianoNote(midi: number, velocity = 1, sustain = false) {
  const c = audio();
  const freq = noteFreq(midi);
  const now = c.currentTime;
  const v = Math.max(0.15, Math.min(1, velocity));

  // Bass strings ring far longer than treble ones; the pedal lifts the
  // dampers off every string, which is the whole point of it
  const base = Math.max(0.7, 3.2 - (midi - 48) * 0.045);
  const seconds = base * (sustain ? 2.6 : 1);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.38 * v, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.14 * v, now + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);

  // A hard note is a brighter note — a piano played softly loses its top end
  const tone = c.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = Math.min(freq * (3 + 6 * v), 11000);

  /**
   * Real strings are stiff, so their overtones sit slightly sharp of exact
   * multiples. That stretch is a large part of why a piano sounds like a
   * piano rather than an organ.
   */
  for (const [ratio, level, type] of [
    [1, 1, 'triangle'],
    [2.001, 0.42 * v, 'sine'],
    [3.005, 0.22 * v, 'sine'],
    [4.012, 0.1 * v, 'sine'],
  ] as const) {
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.value = freq * ratio;
    // a touch of detune so repeated notes are not mechanically identical
    osc.detune.value = (Math.random() - 0.5) * 4;
    const mix = c.createGain();
    mix.gain.value = level;
    osc.connect(mix).connect(tone);
    osc.start(now);
    osc.stop(now + seconds + 0.05);
  }

  tone.connect(gain).connect(out());

  // the hammer felt striking the string
  const thud = c.createBufferSource();
  thud.buffer = noiseBuffer(c, 0.04);
  const thudFilter = c.createBiquadFilter();
  thudFilter.type = 'bandpass';
  thudFilter.frequency.value = Math.min(freq * 5, 5000);
  const thudGain = c.createGain();
  thudGain.gain.setValueAtTime(0.05 * v, now);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  thud.connect(thudFilter).connect(thudGain).connect(out());
  thud.start(now);
}

// ------------------------------------------------------------- tambourine

export type TambourineHit = 'head' | 'rim' | 'shake';

/**
 * Jingles — the little pairs of metal discs. Each one is a handful of high,
 * deliberately unrelated partials over a burst of bright noise: metal that
 * rings at no particular pitch, which is exactly what jingles do.
 */
function jingles(c: AudioContext, at: number, level: number, len: number) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, len);
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 5200;
  const gain = c.createGain();
  gain.gain.setValueAtTime(level, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + len);
  src.connect(hp).connect(gain).connect(out());
  src.start(at);

  // a few discs ringing, none of them in tune with each other
  for (let i = 0; i < 4; i++) {
    const osc = c.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 3200 + Math.random() * 3400;
    const g = c.createGain();
    g.gain.setValueAtTime(level * 0.08, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len * (0.4 + Math.random() * 0.5));
    osc.connect(g).connect(out());
    osc.start(at);
    osc.stop(at + len + 0.05);
  }
}

export function playTambourine(kind: TambourineHit, velocity = 1) {
  const c = audio();
  const now = c.currentTime;
  const v = Math.max(0.2, Math.min(1, velocity));

  if (kind === 'head') {
    // the skin, with the jingles shivering as it is struck
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(105, now + 0.22);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.5 * v, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(gain).connect(out());
    osc.start(now);
    osc.stop(now + 0.26);
    jingles(c, now, 0.22 * v, 0.3);
    return;
  }

  if (kind === 'rim') {
    // struck on the frame: all jingle, almost no skin
    jingles(c, now, 0.42 * v, 0.5);
    const tick = c.createOscillator();
    tick.type = 'triangle';
    tick.frequency.value = 900;
    const g = c.createGain();
    g.gain.setValueAtTime(0.12 * v, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    tick.connect(g).connect(out());
    tick.start(now);
    tick.stop(now + 0.07);
    return;
  }

  // a shake is several uneven rattles, not one clean hit
  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    jingles(c, now + i * (0.018 + Math.random() * 0.03), 0.2 * v, 0.16 + Math.random() * 0.12);
  }
}

// ---------------------------------------------------------------- kalimba

/**
 * A steel tine flicked with a thumbnail.
 *
 * Short, sweet and slightly bell-like: the partials of a clamped metal tongue
 * sit well above the harmonic series (roughly 6× and 17× for an ideal bar),
 * which is why a kalimba shimmers rather than hums. Pitch also decides length
 * here — the long low tines ring on, the short ones barely at all.
 *
 * @param strike 1 = plucked at the tip, 0 = near the bridge, where a tine is
 *               stiff and gives a dull tick instead of a note.
 */
export function playKalimba(midi: number, strike = 1) {
  const c = audio();
  const freq = noteFreq(midi);
  const now = c.currentTime;
  const tip = Math.max(0.15, Math.min(1, strike));
  const len = Math.max(0.5, 2.4 - (midi - 60) * 0.045) * (0.4 + 0.6 * tip);

  for (const [ratio, level, decay] of [
    [1, 0.4 * tip, 1],
    [2.76, 0.12, 0.5],
    [5.4, 0.06 * (1.5 - 0.5 * tip), 0.3],
  ] as const) {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(level, 0.001), now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + len * decay);
    osc.connect(gain).connect(out());
    osc.start(now);
    osc.stop(now + len * decay + 0.03);
  }

  // the thumbnail leaving the metal
  const click = c.createBufferSource();
  click.buffer = noiseBuffer(c, 0.025);
  const shape = c.createBiquadFilter();
  shape.type = 'bandpass';
  shape.frequency.value = Math.min(freq * 6, 6500);
  const clickGain = c.createGain();
  clickGain.gain.setValueAtTime(0.09 * (1.6 - 0.6 * tip), now);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
  click.connect(shape).connect(clickGain).connect(out());
  click.start(now);
}

/** Knuckles on the wooden body, between phrases */
export function playWoodKnock() {
  const c = audio();
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(240, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
  osc.connect(gain).connect(out());
  osc.start(now);
  osc.stop(now + 0.12);

  const tap = c.createBufferSource();
  tap.buffer = noiseBuffer(c, 0.04);
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 900;
  const tapGain = c.createGain();
  tapGain.gain.setValueAtTime(0.2, now);
  tapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  tap.connect(filter).connect(tapGain).connect(out());
  tap.start(now);
}

// ---------------------------------------------------------------- handpan

/**
 * A steel tone field, struck with the pad of the hand.
 *
 * The character comes from three things a xylophone bar doesn't have: an
 * octave and a fifth ringing almost as loudly as the fundamental (steel pans
 * are tuned that way on purpose), a very long decay, and a soft attack — the
 * hand is flesh, not a mallet, so there is no click.
 *
 * @param strike 1 = the middle of the field, 0 = its edge, where a real pan
 *               gives a brighter, shorter ping instead of the full note.
 */
export function playHandpan(midi: number, strike = 1) {
  const c = audio();
  const freq = noteFreq(midi);
  const now = c.currentTime;
  const centre = Math.max(0.15, Math.min(1, strike));
  // low fields ring longest; an edge tap dies far sooner
  const len = (5.2 - (midi - 50) * 0.06) * (0.45 + 0.55 * centre);

  // fundamental, octave, fifth above that — the tuned trio — plus two faint
  // inharmonic partials for the metal
  for (const [ratio, level, decay] of [
    [1, 0.42 * centre, 1],
    [2.0, 0.3, 0.85],
    [3.0, 0.18, 0.7],
    [5.42, 0.05 * (1.6 - 0.6 * centre), 0.4],
    [8.13, 0.03 * (1.8 - 0.8 * centre), 0.28],
  ] as const) {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    osc.detune.value = (Math.random() - 0.5) * 5;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    // a hand, not a hammer: 12 ms swell rather than an instant edge
    gain.gain.exponentialRampToValueAtTime(Math.max(level, 0.001), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + len * decay);
    osc.connect(gain).connect(out());
    osc.start(now);
    osc.stop(now + len * decay + 0.05);
  }

  // the breath of steel under the note
  const shimmer = c.createBufferSource();
  shimmer.buffer = noiseBuffer(c, 0.25);
  const band = c.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = Math.min(freq * 7, 7000);
  band.Q.value = 2.5;
  const shimmerGain = c.createGain();
  shimmerGain.gain.setValueAtTime(0.05 * (1.5 - 0.5 * centre), now);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
  shimmer.connect(band).connect(shimmerGain).connect(out());
  shimmer.start(now);
}

/** The dry slap on the shoulder of the shell, between notes */
export function playHandpanSlap() {
  const c = audio();
  const now = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.18);
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 420;
  filter.Q.value = 1.1;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  src.connect(filter).connect(gain).connect(out());
  src.start(now);
}

// --------------------------------------------------------------- xylophone

/**
 * A struck wooden bar. What makes it read as a xylophone rather than a bell is
 * the inharmonic partial: a tuned bar rings roughly three octaves-and-a-fifth
 * above its fundamental, not at a neat harmonic. Add the knock of the mallet
 * and a very short decay, and it lands.
 */
/**
 * @param strike 1 = struck in the middle, 0 = struck right at the end.
 *
 * A bar has nodes near its ends where it barely moves; hitting there gives a
 * dull knock instead of a note. Rewarding the child for aiming at the middle
 * is both true to the instrument and a reason to aim.
 */
export function playXylophone(midi: number, strike = 1) {
  const c = audio();
  const freq = noteFreq(midi);
  const now = c.currentTime;
  const centre = Math.max(0.12, Math.min(1, strike));
  // small bars ring shorter than big ones; a node hit dies almost at once
  const len = Math.max(0.35, 1.1 - (midi - 60) * 0.025) * (0.35 + 0.65 * centre);

  // fundamental + the bar's characteristic partial
  for (const [ratio, baseLevel, decayScale] of [
    [1, 0.5 * centre, 1],
    // off-centre strikes bring out the partials instead of the fundamental
    [3.01, 0.16 * (1.4 - 0.4 * centre), 0.45],
    [6.02, 0.05 * (1.6 - 0.6 * centre), 0.25],
  ] as const) {
    const level = baseLevel;
    const decay = len * decayScale;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(gain).connect(out());
    osc.start(now);
    osc.stop(now + decay + 0.02);
  }

  // the mallet hitting wood — louder near the ends, where there is no note
  const knock = c.createBufferSource();
  knock.buffer = noiseBuffer(c, 0.03);
  const shape = c.createBiquadFilter();
  shape.type = 'bandpass';
  shape.frequency.value = Math.min(freq * 4, 6000);
  shape.Q.value = 0.9;
  const knockGain = c.createGain();
  knockGain.gain.setValueAtTime(0.22 * (1.7 - 0.7 * centre), now);
  knockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  knock.connect(shape).connect(knockGain).connect(out());
  knock.start(now);
}

// ------------------------------------------------------------------ guitar

/**
 * A guitar body, shared by every note: two resonant peaks where a dreadnought
 * actually resonates, plus a highpass to keep the boom out. Building this once
 * and leaving it connected is what makes plucks sound like they come from the
 * same instrument rather than six unrelated synths.
 */
let guitarBody: BiquadFilterNode | null = null;

function body(): BiquadFilterNode {
  const c = audio();
  if (guitarBody) return guitarBody;

  const input = c.createBiquadFilter();
  input.type = 'highpass';
  input.frequency.value = 70;

  // ~100 Hz air resonance and ~215 Hz top-plate resonance
  const airCavity = c.createBiquadFilter();
  airCavity.type = 'peaking';
  airCavity.frequency.value = 100;
  airCavity.Q.value = 1.2;
  airCavity.gain.value = 6;

  const topPlate = c.createBiquadFilter();
  topPlate.type = 'peaking';
  topPlate.frequency.value = 215;
  topPlate.Q.value = 1.6;
  topPlate.gain.value = 4;

  const presence = c.createBiquadFilter();
  presence.type = 'peaking';
  presence.frequency.value = 2400;
  presence.Q.value = 0.8;
  presence.gain.value = 3;

  input.connect(airCavity).connect(topPlate).connect(presence).connect(out());
  guitarBody = input;
  return input;
}

/**
 * Karplus–Strong: a burst of noise fed back through a short delay, averaged as
 * it goes round.
 *
 * Three things make it sound like a string rather than a beep — a *filtered*
 * excitation (a real pick doesn't inject white noise), damping that scales
 * with pitch (thin strings die faster than thick ones), and a fractional
 * delay so the pitch is actually in tune instead of quantised to whole
 * samples, which is audible on the high strings.
 */
export function playPluck(midi: number, velocity = 1) {
  const c = audio();
  const freq = noteFreq(midi);
  // low strings ring for ages, the top E does not
  const seconds = Math.max(1.2, 3.4 - (midi - 40) * 0.045);
  const length = Math.floor(c.sampleRate * seconds);
  const exact = c.sampleRate / freq;
  const period = Math.max(2, Math.floor(exact));
  const frac = exact - period; // fractional part, applied as an allpass blend

  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);

  // Excitation: noise smoothed a little, so the attack is a pick and not a hiss
  let last = 0;
  for (let i = 0; i < period; i++) {
    const white = Math.random() * 2 - 1;
    last = 0.6 * white + 0.4 * last;
    data[i] = last;
  }

  // Higher notes lose energy faster; 0.9965 → 0.986 across the neck
  const damping = 0.9965 - (midi - 40) * 0.0004;
  let prev = 0;
  for (let i = period; i < length; i++) {
    // the sample one step older than the delay line; at the very first
    // iteration there isn't one, and reading data[-1] would put a NaN into
    // the buffer that then spreads through the whole note and silences it
    const older = i - period - 1 >= 0 ? data[i - period - 1] : data[i - period];
    const avg = 0.5 * (data[i - period] + older);
    // one-pole allpass for the fractional delay
    const tuned = frac * (avg - prev) + prev;
    prev = tuned;
    data[i] = damping * tuned;
  }

  const src = c.createBufferSource();
  src.buffer = buffer;
  // a touch of detune per pluck: no two strokes are identical
  src.detune.value = (Math.random() - 0.5) * 6;

  const gain = c.createGain();
  gain.gain.value = 0.45 * velocity;

  src.connect(gain).connect(body());
  src.start();
}

/**
 * Strums a chord. Real strums are uneven — the pick crosses the strings in a
 * few tens of milliseconds and hits each one slightly differently, so the
 * timing and loudness wobble deliberately.
 */
export function strum(midis: number[], direction: 'down' | 'up' = 'down') {
  const order = direction === 'down' ? midis : [...midis].reverse();
  order.forEach((midi, i) => {
    const delay = i * (26 + Math.random() * 14);
    const velocity = 0.75 + Math.random() * 0.35;
    window.setTimeout(() => playPluck(midi, velocity), delay);
  });
}

// ------------------------------------------------------------------- drums

export type DrumKind =
  | 'kick'
  | 'snare'
  | 'rimshot'
  | 'hihat'
  | 'openHat'
  | 'tom'
  | 'tom2'
  | 'floorTom'
  | 'crash'
  | 'ride'
  | 'rideBell';

export function playDrum(kind: DrumKind) {
  const c = audio();
  const now = c.currentTime;
  const gain = c.createGain();
  gain.connect(out());

  // The bell is a struck alloy dome: two inharmonic partials, long tail
  if (kind === 'rideBell') {
    for (const [freq, level, len] of [
      [1180, 0.22, 1.4],
      [1790, 0.12, 1.0],
    ] as const) {
      const osc = c.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      const g = c.createGain();
      g.gain.setValueAtTime(level, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + len);
      osc.connect(g).connect(out());
      osc.start(now);
      osc.stop(now + len + 0.02);
    }
    const shimmer = c.createBufferSource();
    shimmer.buffer = noiseBuffer(c, 0.9);
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5000;
    const sg = c.createGain();
    sg.gain.setValueAtTime(0.12, now);
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    shimmer.connect(hp).connect(sg).connect(out());
    shimmer.start(now);
    return;
  }

  // A rimshot is the stick hitting hoop and head at once: a hard crack over
  // the normal snare
  if (kind === 'rimshot') {
    const crack = c.createOscillator();
    crack.type = 'square';
    crack.frequency.setValueAtTime(1900, now);
    crack.frequency.exponentialRampToValueAtTime(400, now + 0.06);
    const cg = c.createGain();
    cg.gain.setValueAtTime(0.4, now);
    cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    crack.connect(cg).connect(out());
    crack.start(now);
    crack.stop(now + 0.1);
    playDrum('snare');
    return;
  }

  if (kind === 'kick' || kind === 'tom' || kind === 'tom2' || kind === 'floorTom') {
    const [from, to, len, level] =
      kind === 'kick'
        ? [150, 45, 0.45, 1]
        : kind === 'tom'
          ? [260, 120, 0.35, 0.8]
          : kind === 'tom2'
            ? [180, 90, 0.4, 0.8]
            : [120, 62, 0.6, 0.85]; // floor tom — bigger shell, slower fall
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(to, now + len);
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + len);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + len + 0.02);
    return;
  }

  // snare / hats / cymbals are all shaped noise — only the filter and the
  // length differ, which is most of what tells them apart to the ear
  const len =
    kind === 'hihat'
      ? 0.06
      : kind === 'openHat'
        ? 0.45
        : kind === 'snare'
          ? 0.22
          : kind === 'ride'
            ? 1.1
            : 1.2;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, len);
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value =
    kind === 'hihat' || kind === 'openHat'
      ? 7000
      : kind === 'snare'
        ? 1200
        : kind === 'ride'
          ? 5500
          : 4000;
  gain.gain.setValueAtTime(kind === 'crash' ? 0.35 : kind === 'ride' ? 0.22 : 0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + len);
  src.connect(filter).connect(gain);
  src.start(now);

  if (kind === 'snare') {
    // the drum under the rattle
    const body = c.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(190, now);
    const bodyGain = c.createGain();
    bodyGain.gain.setValueAtTime(0.35, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    body.connect(bodyGain).connect(out());
    body.start(now);
    body.stop(now + 0.18);
  }
}

// ------------------------------------------------- electronic drum pads

export type EPadKind =
  | 'kick808'
  | 'sub'
  | 'snare808'
  | 'clap'
  | 'rim'
  | 'closedHat'
  | 'openHat'
  | 'cymbal'
  | 'cowbell'
  | 'blip'
  | 'zap'
  | 'laser'
  | 'tomHigh'
  | 'tomLow'
  | 'noiseSweep'
  | 'stab';

/**
 * The 808/909 family — machine drums rather than the acoustic kit.
 *
 * They are all the same three ingredients in different proportions: a sine
 * whose pitch falls, a burst of filtered noise, and how fast each fades.
 */
export function playEPad(kind: EPadKind, velocity = 1) {
  const c = audio();
  const now = c.currentTime;
  // a soft hit is quieter *and* duller, which is what a real pad does
  const v = Math.max(0.15, Math.min(1, velocity));

  const tone = (
    from: number,
    to: number,
    len: number,
    baseLevel: number,
    type: OscillatorType = 'sine',
  ) => {
    const level = baseLevel * v;
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, now + len);
    const gain = c.createGain();
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + len);
    osc.connect(gain).connect(out());
    osc.start(now);
    osc.stop(now + len + 0.02);
  };

  const noise = (
    hz: number,
    len: number,
    baseLevel: number,
    type: BiquadFilterType = 'highpass',
    at = 0,
    q = 1,
  ) => {
    const level = baseLevel * v;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, len);
    const filter = c.createBiquadFilter();
    filter.type = type;
    // softer hits lose their top end
    filter.frequency.value = type === 'highpass' ? hz : hz * (0.7 + 0.3 * v);
    filter.Q.value = q;
    const gain = c.createGain();
    gain.gain.setValueAtTime(level, now + at);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + len);
    src.connect(filter).connect(gain).connect(out());
    src.start(now + at);
  };

  switch (kind) {
    case 'kick808':
      tone(120, 42, 0.85, 0.9);
      noise(200, 0.02, 0.25, 'lowpass');
      break;
    case 'sub':
      tone(80, 28, 1.3, 0.9);
      break;
    case 'snare808':
      tone(190, 150, 0.16, 0.35, 'triangle');
      tone(330, 300, 0.14, 0.2, 'triangle');
      noise(1400, 0.24, 0.5);
      break;
    case 'clap':
      // three quick bursts then a tail — that stuttered attack *is* the clap
      [0, 0.012, 0.024].forEach((at) => noise(1100, 0.035, 0.4, 'bandpass', at, 1.2));
      noise(1000, 0.22, 0.22, 'bandpass', 0.036, 1.2);
      break;
    case 'rim':
      tone(1700, 1500, 0.03, 0.35, 'square');
      noise(2600, 0.03, 0.25, 'bandpass', 0, 2);
      break;
    case 'closedHat':
      noise(9000, 0.045, 0.4);
      break;
    case 'openHat':
      noise(8500, 0.4, 0.32);
      break;
    case 'cymbal':
      noise(6000, 1.6, 0.3);
      break;
    case 'cowbell':
      tone(540, 540, 0.35, 0.28, 'square');
      tone(800, 800, 0.32, 0.22, 'square');
      break;
    case 'blip':
      tone(880, 1320, 0.12, 0.3, 'square');
      break;
    case 'zap':
      tone(1400, 90, 0.28, 0.4, 'sawtooth');
      break;
    case 'laser':
      tone(220, 2200, 0.25, 0.3, 'square');
      break;
    case 'tomHigh':
      tone(300, 150, 0.3, 0.6);
      break;
    case 'tomLow':
      tone(180, 80, 0.45, 0.7);
      break;
    case 'noiseSweep': {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 0.9);
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 3;
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(7000, now + 0.85);
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      src.connect(filter).connect(gain).connect(out());
      src.start(now);
      break;
    }
    case 'stab':
      // a chord hit: three notes at once, short
      [130.8, 155.6, 196].forEach((f) => tone(f, f, 0.28, 0.22, 'sawtooth'));
      break;
  }
}

// ------------------------------------------------------------------- tabla

/**
 * The bols a child is taught first. Dayan (right, pitched) carries Na, Tin
 * and Te; bayan (left, the bass) carries Ge and Ka.
 */
export type TablaBol = 'na' | 'tin' | 'te' | 'ge' | 'ka' | 'dha';

export function playTabla(bol: TablaBol) {
  const c = audio();
  const now = c.currentTime;

  const membrane = (freq: number, len: number, level: number, bend?: number) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (bend) osc.frequency.exponentialRampToValueAtTime(bend, now + len * 0.7);
    const gain = c.createGain();
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + len);
    osc.connect(gain).connect(out());
    osc.start(now);
    osc.stop(now + len + 0.02);
  };

  const slap = (hz: number, len: number, level: number) => {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, len);
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = hz;
    filter.Q.value = 1.4;
    const gain = c.createGain();
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + len);
    src.connect(filter).connect(gain).connect(out());
    src.start(now);
  };

  switch (bol) {
    case 'na': // rim, bright and short
      membrane(640, 0.3, 0.3);
      slap(2600, 0.06, 0.25);
      break;
    case 'tin': // open centre, rings
      membrane(480, 0.8, 0.35);
      slap(1800, 0.05, 0.15);
      break;
    case 'te': // flat slap, no ring
      slap(1500, 0.07, 0.4);
      break;
    case 'ge': // bayan open — the boom, pitch bends down
      membrane(110, 0.7, 0.5, 65);
      break;
    case 'ka': // bayan closed
      slap(320, 0.12, 0.35);
      membrane(90, 0.12, 0.25);
      break;
    case 'dha': // na + ge together
      membrane(640, 0.3, 0.25);
      membrane(110, 0.7, 0.45, 65);
      slap(2600, 0.06, 0.2);
      break;
  }
}
