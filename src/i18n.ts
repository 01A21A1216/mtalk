import { KN_CATEGORIES, KN_WORDS } from './data/kn';
import { TA_CATEGORIES, TA_WORDS } from './data/ta';
import { TE_CATEGORIES, TE_WORDS } from './data/te';
import type { Category, Language, Word } from './types';

/**
 * Central label lookup. English and Hindi live on the word objects themselves;
 * additional languages are id-keyed maps that fall back to English (so custom
 * tiles and untranslated words always show something speakable).
 */

const EXTRA_LANGS: Partial<
  Record<Language, { words: Record<string, string>; categories: Record<string, string> }>
> = {
  te: { words: TE_WORDS, categories: TE_CATEGORIES },
  ta: { words: TA_WORDS, categories: TA_CATEGORIES },
  kn: { words: KN_WORDS, categories: KN_CATEGORIES },
};

export function wordLabel(word: Word, language: Language): string {
  if (language === 'en') return word.en;
  if (language === 'hi') return word.hi || word.en;
  return EXTRA_LANGS[language]?.words[word.id] ?? word.en;
}

/** What the TTS engine should say (uses speak-overrides where present) */
export function wordSpeech(word: Word, language: Language): string {
  if (language === 'en') return word.speakEn ?? word.en;
  if (language === 'hi') return word.speakHi ?? (word.hi || word.en);
  return EXTRA_LANGS[language]?.words[word.id] ?? (word.speakEn ?? word.en);
}

/** Small caption under the main label — always a different script than primary */
export function wordSecondary(word: Word, language: Language): string {
  return language === 'en' ? word.hi : word.en;
}

export function categoryLabel(category: Category, language: Language): string {
  if (language === 'en') return category.en;
  if (language === 'hi') return category.hi;
  return EXTRA_LANGS[language]?.categories[category.id] ?? category.en;
}

interface UiStrings {
  tagline: string;
  tabHome: string;
  tabTalk: string;
  tabLearn: string;
  tabQuiz: string;
  tabWrite: string;
  sentenceHint: string;
  quizPrompt: (word: string) => string;
  praise: string;
  tryAgain: string;
  notEnoughWords: string;
  first: string;
  then: string;
}

export const UI: Record<Language, UiStrings> = {
  en: {
    tagline: 'My Voice',
    tabHome: 'Home',
    tabTalk: 'Talk',
    tabLearn: 'Learn',
    tabQuiz: 'Quiz',
    tabWrite: 'Write',
    sentenceHint: '👇 Tap pictures to talk',
    quizPrompt: (w) => `Where is ${w}?`,
    praise: 'Very good!',
    tryAgain: 'Try again!',
    notEnoughWords: 'Not enough words in this category to practise. Pick another one!',
    first: 'First',
    then: 'Then',
  },
  hi: {
    tagline: 'मेरी आवाज़',
    tabHome: 'होम',
    tabTalk: 'बात',
    tabLearn: 'सीखो',
    tabQuiz: 'खेलो',
    tabWrite: 'लिखो',
    sentenceHint: '👇 बोलने के लिए चित्र दबाओ',
    quizPrompt: (w) => `${w} कहाँ है?`,
    praise: 'शाबाश!',
    tryAgain: 'फिर से कोशिश करो',
    notEnoughWords: 'इस श्रेणी में अभ्यास के लिए पर्याप्त शब्द नहीं हैं।',
    first: 'पहले',
    then: 'फिर',
  },
  te: {
    tagline: 'నా గొంతు',
    tabHome: 'హోమ్',
    tabTalk: 'మాట',
    tabLearn: 'నేర్చుకో',
    tabQuiz: 'ఆడు',
    tabWrite: 'రాయి',
    sentenceHint: '👇 మాట్లాడటానికి బొమ్మలు నొక్కండి',
    quizPrompt: (w) => `${w} ఎక్కడ ఉంది?`,
    praise: 'శభాష్!',
    tryAgain: 'మళ్ళీ ప్రయత్నించు',
    notEnoughWords: 'ఈ విభాగంలో సాధన చేయడానికి సరిపడా పదాలు లేవు.',
    first: 'ముందు',
    then: 'తర్వాత',
  },
  ta: {
    tagline: 'என் குரல்',
    tabHome: 'ஹோம்',
    tabTalk: 'பேசு',
    tabLearn: 'கற்க',
    tabQuiz: 'விளையாடு',
    tabWrite: 'எழுது',
    sentenceHint: '👇 பேச படங்களைத் தொடவும்',
    quizPrompt: (w) => `${w} எங்கே?`,
    praise: 'சபாஷ்!',
    tryAgain: 'மீண்டும் முயற்சி செய்',
    notEnoughWords: 'இந்தப் பிரிவில் பயிற்சிக்கு போதுமான சொற்கள் இல்லை.',
    first: 'முதலில்',
    then: 'பிறகு',
  },
  kn: {
    tagline: 'ನನ್ನ ಧ್ವನಿ',
    tabHome: 'ಹೋಮ್',
    tabTalk: 'ಮಾತು',
    tabLearn: 'ಕಲಿ',
    tabQuiz: 'ಆಡು',
    tabWrite: 'ಬರಿ',
    sentenceHint: '👇 ಮಾತನಾಡಲು ಚಿತ್ರಗಳನ್ನು ಒತ್ತಿ',
    quizPrompt: (w) => `${w} ಎಲ್ಲಿದೆ?`,
    praise: 'ಭೇಷ್!',
    tryAgain: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸು',
    notEnoughWords: 'ಈ ವಿಭಾಗದಲ್ಲಿ ಅಭ್ಯಾಸಕ್ಕೆ ಸಾಕಷ್ಟು ಪದಗಳಿಲ್ಲ.',
    first: 'ಮೊದಲು',
    then: 'ಆಮೇಲೆ',
  },
};
