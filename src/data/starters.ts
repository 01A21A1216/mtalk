import type { Language, Word } from '../types';

/**
 * Sentence starters — the frames that turn a single tile into a phrase.
 *
 * Modelling "I want ___" and waiting is standard AAC practice: the child
 * supplies the noun they already know, and the grammar comes along for the
 * ride. Each frame is a pseudo-word so it drops into the sentence strip and is
 * spoken like anything else.
 */

interface Frame {
  id: string;
  emoji: string;
  labels: Record<Language, string>;
}

const FRAMES: Frame[] = [
  {
    id: 'i-want',
    emoji: '🤲',
    labels: {
      en: 'I want',
      hi: 'मुझे चाहिए',
      te: 'నాకు కావాలి',
      ta: 'எனக்கு வேண்டும்',
      kn: 'ನನಗೆ ಬೇಕು',
      mr: 'मला हवं',
      bn: 'আমার চাই',
    },
  },
  {
    id: 'i-see',
    emoji: '👀',
    labels: {
      en: 'I see',
      hi: 'मैं देख रहा हूँ',
      te: 'నేను చూస్తున్నాను',
      ta: 'நான் பார்க்கிறேன்',
      kn: 'ನಾನು ನೋಡುತ್ತಿದ್ದೇನೆ',
      mr: 'मला दिसतंय',
      bn: 'আমি দেখছি',
    },
  },
  {
    id: 'i-like',
    emoji: '❤️',
    labels: {
      en: 'I like',
      hi: 'मुझे पसंद है',
      te: 'నాకు ఇష్టం',
      ta: 'எனக்கு பிடிக்கும்',
      kn: 'ನನಗೆ ಇಷ್ಟ',
      mr: 'मला आवडतं',
      bn: 'আমার ভালো লাগে',
    },
  },
  {
    id: 'i-dont-like',
    emoji: '🙅',
    labels: {
      en: "I don't like",
      hi: 'मुझे पसंद नहीं',
      te: 'నాకు ఇష్టం లేదు',
      ta: 'எனக்கு பிடிக்காது',
      kn: 'ನನಗೆ ಇಷ್ಟವಿಲ್ಲ',
      mr: 'मला आवडत नाही',
      bn: 'আমার ভালো লাগে না',
    },
  },
  {
    id: 'more-please',
    emoji: '➕',
    labels: {
      en: 'More',
      hi: 'और',
      te: 'ఇంకా',
      ta: 'இன்னும்',
      kn: 'ಇನ್ನೂ',
      mr: 'आणखी',
      bn: 'আরও',
    },
  },
  {
    id: 'all-done',
    emoji: '✅',
    labels: {
      en: 'All done',
      hi: 'हो गया',
      te: 'అయిపోయింది',
      ta: 'முடிந்தது',
      kn: 'ಮುಗಿಯಿತು',
      mr: 'झालं',
      bn: 'শেষ',
    },
  },
  {
    id: 'help-me',
    emoji: '🙋',
    labels: {
      en: 'Help me',
      hi: 'मेरी मदद करो',
      te: 'నాకు సహాయం చేయండి',
      ta: 'எனக்கு உதவுங்கள்',
      kn: 'ನನಗೆ ಸಹಾಯ ಮಾಡಿ',
      mr: 'मला मदत करा',
      bn: 'আমাকে সাহায্য করো',
    },
  },
  {
    id: 'my-turn',
    emoji: '🙋‍♂️',
    labels: {
      en: 'My turn',
      hi: 'मेरी बारी',
      te: 'నా వంతు',
      ta: 'என் முறை',
      kn: 'ನನ್ನ ಸರದಿ',
      mr: 'माझी पाळी',
      bn: 'আমার পালা',
    },
  },
];

/**
 * Frames as words the sentence strip can hold and speak.
 *
 * The label and speech layers resolve Telugu/Tamil/Kannada through a
 * translation table keyed by word id, which these generated frames are not in.
 * So the active language's text is placed in `en` — the field both layers fall
 * back to — while the voice is still chosen from the language setting.
 */
export function starterWords(language: Language): Word[] {
  return FRAMES.map((f) => {
    const text = f.labels[language] ?? f.labels.en;
    return {
      id: `frame-${f.id}`,
      emoji: f.emoji,
      en: text,
      hi: f.labels.hi,
      level: 1 as const,
      speakEn: text,
      speakHi: f.labels.hi,
    };
  });
}
