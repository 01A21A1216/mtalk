import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { wordSpeech } from '../i18n';
import { recordedVoiceFor } from './voicePack';
import type { Language, Word } from '../types';

/**
 * Text-to-speech, by two roads.
 *
 * In a browser this is the Web Speech API. Inside the installed app it is the
 * device's own TTS engine through a Capacitor plugin, because Android's System
 * WebView does not implement Web Speech at all — the same code that talks in
 * Chrome is silent in the APK, which is exactly the sort of difference that
 * only shows up on a real tablet.
 */

/** True inside the installed Android/iOS app, false in any browser */
const native = Capacitor.isNativePlatform();

let voices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  voices = window.speechSynthesis.getVoices();
}

if (!native && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

const LANG_PREFERENCES: Record<Language, string[]> = {
  en: ['en-IN', 'en-GB', 'en-US', 'en'],
  hi: ['hi-IN', 'hi'],
  te: ['te-IN', 'te'],
  ta: ['ta-IN', 'ta'],
  kn: ['kn-IN', 'kn'],
  mr: ['mr-IN', 'mr'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
};

const LANG_TAGS: Record<Language, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
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

/** Stops whatever is being said, on whichever engine is in use */
export function stopSpeaking() {
  if (native) {
    void TextToSpeech.stop().catch(() => {
      // nothing was playing
    });
    return;
  }
  window.speechSynthesis?.cancel();
}

export function speak(text: string, language: Language, rate = 0.85, onEnd?: () => void) {
  if (!text.trim()) {
    onEnd?.();
    return;
  }

  if (native) {
    // the plugin resolves when the device has finished speaking
    void TextToSpeech.stop()
      .catch(() => {
        // nothing to stop
      })
      .then(() =>
        TextToSpeech.speak({
          text,
          lang: LANG_TAGS[language],
          rate,
          pitch: 1.1,
          category: 'playback',
        }),
      )
      .then(() => onEnd?.())
      .catch(() => onEnd?.());
    return;
  }

  if (!('speechSynthesis' in window)) {
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
  // a parent's own recording of this word wins over any synthetic voice
  const recorded = recordedVoiceFor(word.id);
  if (recorded) {
    stopSpeaking();
    void playAudioAsync(recorded);
    return;
  }
  if (word.audio) {
    stopSpeaking();
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
    const recorded = recordedVoiceFor(word.id);
    if (recorded) {
      await playAudioAsync(recorded);
    } else if (word.audio) {
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

/**
 * A one-line account of what this device can actually say.
 *
 * Speech is the one part of MTalk that depends entirely on the tablet: the
 * engine differs between the installed app and a browser, and a language only
 * speaks if its voice is installed. When a board goes quiet, this says why.
 */
export async function describeSpeech(language: Language): Promise<string> {
  const tag = LANG_TAGS[language];
  if (native) {
    try {
      const { languages } = await TextToSpeech.getSupportedLanguages();
      const has = languages.some((l) => l.toLowerCase().startsWith(tag.slice(0, 2)));
      return has
        ? `App voice: ${languages.length} languages installed, including ${tag}.`
        : `App voice: ${languages.length} languages installed, but no ${tag}. Install it in Settings → General → Text-to-speech.`;
    } catch {
      return 'App voice: this tablet has no text-to-speech engine. Install Google Text-to-Speech from the Play Store.';
    }
  }
  if (!('speechSynthesis' in window)) return 'Browser voice: this browser cannot speak.';
  if (voices.length === 0) refreshVoices();
  const match = pickVoice(language);
  return match
    ? `Browser voice: ${voices.length} voices, using ${match.name} (${match.lang}).`
    : `Browser voice: ${voices.length} voices, none for ${tag} — falling back to the default.`;
}
