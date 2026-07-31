import { wordSpeech } from '../i18n';
import type { Language, Word } from '../types';

/**
 * Text-to-speech built on the Web Speech API. On Android/iOS tablets this
 * uses the device's installed voices — most Indian devices ship with
 * en-IN and hi-IN voices out of the box.
 */

let voices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  voices = window.speechSynthesis.getVoices();
}

if ('speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

const LANG_PREFERENCES: Record<Language, string[]> = {
  en: ['en-IN', 'en-GB', 'en-US', 'en'],
  hi: ['hi-IN', 'hi'],
  te: ['te-IN', 'te'],
  ta: ['ta-IN', 'ta'],
  kn: ['kn-IN', 'kn'],
};

const LANG_TAGS: Record<Language, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
};

function pickVoice(language: Language): SpeechSynthesisVoice | null {
  if (voices.length === 0) refreshVoices();
  for (const pref of LANG_PREFERENCES[language]) {
    const exact = voices.find((v) => v.lang.toLowerCase() === pref.toLowerCase());
    if (exact) return exact;
    const partial = voices.find((v) =>
      v.lang.toLowerCase().startsWith(pref.toLowerCase()),
    );
    if (partial) return partial;
  }
  return null;
}

export function speak(text: string, language: Language, rate = 0.85, onEnd?: () => void) {
  if (!('speechSynthesis' in window) || !text.trim()) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(language);
  if (voice) utterance.voice = voice;
  utterance.lang = LANG_TAGS[language];
  utterance.rate = rate;
  utterance.pitch = 1.1; // slightly higher pitch sounds friendlier to kids
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
  // Chrome can leave the queue paused after a cancel(); resume defensively
  window.speechSynthesis.resume();
}

export function speakAsync(text: string, language: Language, rate?: number): Promise<void> {
  return new Promise((resolve) => speak(text, language, rate, resolve));
}

/** Play a recorded clip (data URL); resolves when finished */
export function playAudioAsync(dataUrl: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(dataUrl);
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

export function wordText(word: Word, language: Language): string {
  return wordSpeech(word, language);
}

export function speakWord(
  word: Word,
  language: Language,
  rate?: number,
  motherTongue?: Language | null,
) {
  if (word.audio) {
    window.speechSynthesis?.cancel();
    void playAudioAsync(word.audio);
    return;
  }
  // optionally echo the word in the family's language right after
  if (motherTongue && motherTongue !== language) {
    void speakAsync(wordText(word, language), language, rate).then(() =>
      speak(wordText(word, motherTongue), motherTongue, rate),
    );
    return;
  }
  speak(wordText(word, language), language, rate);
}

/**
 * Speak a sentence tile-by-tile: recorded audio for custom tiles, TTS for the
 * rest. Sequential so words never talk over each other.
 */
export async function playSequence(words: Word[], language: Language, rate?: number): Promise<void> {
  for (const word of words) {
    if (word.audio) {
      await playAudioAsync(word.audio);
    } else {
      await speakAsync(wordText(word, language), language, rate);
    }
  }
}

export function sentenceText(words: Word[], language: Language): string {
  return words
    .map((word) => wordText(word, language))
    .join(language === 'en' ? ', ' : ' ');
}

/** Short "pop" feedback sound so every tap feels responsive */
let audioContext: AudioContext | null = null;

export function playPop() {
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') void audioContext.resume();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);
    osc.connect(gain).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.12);
  } catch {
    // audio feedback is best-effort only
  }
}
