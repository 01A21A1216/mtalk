import { speakAsync } from './speech';
import type { Language } from '../types';

/**
 * Fun sounds that play before a word is spoken: animal noises via TTS
 * onomatopoeia (works offline, localised for Hindi), vehicle sounds via
 * tiny WebAudio synths. Cause-and-effect audio is often what first hooks
 * pre-verbal kids into intentional tapping.
 */

type SynthEffect = 'horn' | 'siren' | 'bell' | 'whistle';

interface Sfx {
  say?: { en: string; hi?: string };
  synth?: SynthEffect;
}

const TABLE: [string[], Sfx][] = [
  // Animals
  [['dog', 'f-dog'], { say: { en: 'Woof woof!', hi: 'भौं भौं!' } }],
  [['cat', 'f-cat'], { say: { en: 'Meow meow!', hi: 'म्याऊँ म्याऊँ!' } }],
  [['cow', 'f-cow'], { say: { en: 'Moo moo!', hi: 'मू मू!' } }],
  [['lion'], { say: { en: 'Roaaar!', hi: 'दहाड़!' } }],
  [['tiger'], { say: { en: 'Grrrr!', hi: 'गुर्र!' } }],
  [['elephant'], { say: { en: 'Pawooo!', hi: 'चिंघाड़!' } }],
  [['goat'], { say: { en: 'Meh meh!', hi: 'में में!' } }],
  [['sheep'], { say: { en: 'Baa baa!', hi: 'बा बा!' } }],
  [['horse'], { say: { en: 'Neigh neigh!', hi: 'हिनहिन!' } }],
  [['monkey'], { say: { en: 'Ooh ooh aah aah!', hi: 'हूप हूप!' } }],
  [['snake'], { say: { en: 'Sssssss!', hi: 'सससस!' } }],
  [['frog'], { say: { en: 'Ribbit ribbit!', hi: 'टर्र टर्र!' } }],
  [['duck', 'f-duck'], { say: { en: 'Quack quack!', hi: 'क्वैक क्वैक!' } }],
  [['hen'], { say: { en: 'Cluck cluck!', hi: 'कुड़ कुड़!' } }],
  [['bear'], { say: { en: 'Grrrowl!', hi: 'गुर्र!' } }],
  [['pig'], { say: { en: 'Oink oink!' } }],
  // Birds
  [['crow'], { say: { en: 'Caw caw!', hi: 'काँव काँव!' } }],
  [['sparrow', 'f-bird'], { say: { en: 'Tweet tweet!', hi: 'चीं चीं!' } }],
  [['pigeon'], { say: { en: 'Gutur goo!', hi: 'गुटर गूँ!' } }],
  [['owl'], { say: { en: 'Hoo hoo!', hi: 'हू हू!' } }],
  [['peacock'], { say: { en: 'May-awe!', hi: 'मियाऊ!' } }],
  [['parrot'], { say: { en: 'Squawk!', hi: 'टें टें!' } }],
  // Vehicles
  [['car', 'f-car', 'scooter', 'auto'], { synth: 'horn' }],
  [['bus-vehicle', 'f-bus', 'truck'], { synth: 'horn' }],
  [['ambulance', 'police-car', 'fireengine'], { synth: 'siren' }],
  [['cycle-vehicle', 'f-cycle', 'cycle'], { synth: 'bell' }],
  [['train-vehicle', 'f-train', 'metro'], { say: { en: 'Chhuk chhuk chhuk!', hi: 'छुक छुक छुक!' } }],
  [['aeroplane'], { say: { en: 'Zooooom!', hi: 'ज़ूऽऽम!' } }],
  [['rocket'], { say: { en: 'Whooosh!', hi: 'सांय!' } }],
];

const BY_ID = new Map<string, Sfx>();
for (const [ids, sfx] of TABLE) for (const id of ids) BY_ID.set(id, sfx);

export function getSfx(wordId: string): Sfx | undefined {
  return BY_ID.get(wordId);
}

let ctx: AudioContext | null = null;
function audio(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  ac: AudioContext,
  type: OscillatorType,
  freq: number,
  start: number,
  duration: number,
  volume = 0.2,
  sweepTo?: number,
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  if (sweepTo) {
    osc.frequency.linearRampToValueAtTime(sweepTo, ac.currentTime + start + duration);
  }
  gain.gain.setValueAtTime(volume, ac.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.02);
}

function playSynth(effect: SynthEffect): Promise<void> {
  try {
    const ac = audio();
    switch (effect) {
      case 'horn':
        tone(ac, 'square', 420, 0, 0.25, 0.14);
        tone(ac, 'square', 340, 0, 0.25, 0.14);
        tone(ac, 'square', 420, 0.35, 0.4, 0.14);
        tone(ac, 'square', 340, 0.35, 0.4, 0.14);
        return new Promise((r) => setTimeout(r, 850));
      case 'siren':
        tone(ac, 'sine', 600, 0, 0.5, 0.16, 1000);
        tone(ac, 'sine', 1000, 0.5, 0.5, 0.16, 600);
        tone(ac, 'sine', 600, 1.0, 0.5, 0.16, 1000);
        return new Promise((r) => setTimeout(r, 1600));
      case 'bell':
        tone(ac, 'triangle', 1200, 0, 0.3, 0.18);
        tone(ac, 'triangle', 1600, 0.02, 0.25, 0.1);
        tone(ac, 'triangle', 1200, 0.35, 0.4, 0.18);
        tone(ac, 'triangle', 1600, 0.37, 0.3, 0.1);
        return new Promise((r) => setTimeout(r, 800));
      case 'whistle':
        tone(ac, 'sine', 900, 0, 0.6, 0.15, 1100);
        return new Promise((r) => setTimeout(r, 700));
    }
  } catch {
    // sound is best-effort
  }
  return Promise.resolve();
}

/** Play a word's fun sound (if any). Resolves when the sound finishes. */
export async function playWordSfx(wordId: string, language: Language, rate: number): Promise<boolean> {
  const sfx = BY_ID.get(wordId);
  if (!sfx) return false;
  if (sfx.synth) {
    await playSynth(sfx.synth);
    return true;
  }
  if (sfx.say) {
    const text = language === 'hi' && sfx.say.hi ? sfx.say.hi : sfx.say.en;
    const lang: Language = language === 'hi' && sfx.say.hi ? 'hi' : 'en';
    await speakAsync(text, lang, Math.min(1.1, rate + 0.15));
    return true;
  }
  return false;
}
