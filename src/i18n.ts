import { BN_CATEGORIES, BN_WORDS } from './data/bn';
import { KN_CATEGORIES, KN_WORDS } from './data/kn';
import { MR_CATEGORIES, MR_WORDS } from './data/mr';
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
  mr: { words: MR_WORDS, categories: MR_CATEGORIES },
  bn: { words: BN_WORDS, categories: BN_CATEGORIES },
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

/**
 * Small caption under the main label: the family's mother tongue, so a child
 * learning in English still sees the word at home in తెలుగు / हिन्दी / …
 * Falls back to the old behaviour when no mother tongue is set.
 */
export function wordSecondary(
  word: Word,
  language: Language,
  motherTongue?: Language | null,
): string {
  // null = caregiver chose "None"; undefined = caller didn't set one yet
  if (motherTongue === null) return '';
  const mt = motherTongue ?? (language === 'en' ? 'hi' : 'en');
  if (mt === language) return '';
  return wordLabel(word, mt);
}

/** Labelled blocks inside a category (used by the First 100 board) */
const SECTIONS: Record<string, Record<Language, string>> = {
  family: {
    en: '👨‍👩‍👧 Family',
    hi: '👨‍👩‍👧 परिवार',
    te: '👨‍👩‍👧 కుటుంబం',
    ta: '👨‍👩‍👧 குடும்பம்',
    kn: '👨‍👩‍👧 ಕುಟುಂಬ',
    mr: '👨‍👩‍👧 कुटुंब',
    bn: '👨‍👩‍👧 পরিবার',
  },
  talking: {
    en: '💬 Talking',
    hi: '💬 बातचीत',
    te: '💬 మాటలు',
    ta: '💬 பேச்சு',
    kn: '💬 ಮಾತು',
    mr: '💬 बोलणे',
    bn: '💬 কথা',
  },
  feelings: {
    en: '😊 Feelings',
    hi: '😊 भावनाएँ',
    te: '😊 భావాలు',
    ta: '😊 உணர்வுகள்',
    kn: '😊 ಭಾವನೆಗಳು',
    mr: '😊 भावना',
    bn: '😊 অনুভূতি',
  },
  doing: {
    en: '🏃 Doing',
    hi: '🏃 काम',
    te: '🏃 పనులు',
    ta: '🏃 செயல்கள்',
    kn: '🏃 ಕೆಲಸಗಳು',
    mr: '🏃 कामं',
    bn: '🏃 কাজ',
  },
  eating: {
    en: '🍽️ Eating',
    hi: '🍽️ खाना',
    te: '🍽️ ఆహారం',
    ta: '🍽️ உணவு',
    kn: '🍽️ ಊಟ',
    mr: '🍽️ खाणं',
    bn: '🍽️ খাবার',
  },
  body: {
    en: '🖐️ My body',
    hi: '🖐️ शरीर',
    te: '🖐️ శరీరం',
    ta: '🖐️ உடல்',
    kn: '🖐️ ದೇಹ',
    mr: '🖐️ शरीर',
    bn: '🖐️ শরীর',
  },
  things: {
    en: '🧸 Things',
    hi: '🧸 चीज़ें',
    te: '🧸 వస్తువులు',
    ta: '🧸 பொருட்கள்',
    kn: '🧸 ವಸ್ತುಗಳು',
    mr: '🧸 वस्तू',
    bn: '🧸 জিনিস',
  },
  animals: {
    en: '🐶 Animals',
    hi: '🐶 जानवर',
    te: '🐶 జంతువులు',
    ta: '🐶 விலங்குகள்',
    kn: '🐶 ಪ್ರಾಣಿಗಳು',
    mr: '🐶 प्राणी',
    bn: '🐶 প্রাণী',
  },
  outside: {
    en: '🌳 Outside',
    hi: '🌳 बाहर',
    te: '🌳 బయట',
    ta: '🌳 வெளியே',
    kn: '🌳 ಹೊರಗೆ',
    mr: '🌳 बाहेर',
    bn: '🌳 বাইরে',
  },
  littlewords: {
    en: '➕ Little words',
    hi: '➕ छोटे शब्द',
    te: '➕ చిన్న పదాలు',
    ta: '➕ சிறு சொற்கள்',
    kn: '➕ ಚಿಕ್ಕ ಪದಗಳು',
    mr: '➕ छोटे शब्द',
    bn: '➕ ছোট শব্দ',
  },
};

export function sectionLabel(key: string, language: Language): string {
  return SECTIONS[key]?.[language] ?? SECTIONS[key]?.en ?? key;
}

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  te: 'తెలుగు',
  ta: 'தமிழ்',
  kn: 'ಕನ್ನಡ',
  mr: 'मराठी',
  bn: 'বাংলা',
};

export const LANGUAGE_ORDER: Language[] = ['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn'];

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
  tabMusic: string;
  sentenceHint: string;
  numbersShown: string;
  quizPrompt: (word: string) => string;
  praise: string;
  tryAgain: string;
  notEnoughWords: string;
  first: string;
  then: string;
  videoWarn: string;
  videoOver: string;
  breatheIn: string;
  breatheHold: string;
  breatheOut: string;
  whichOne: string;
}

export const UI: Record<Language, UiStrings> = {
  en: {
    tagline: 'My Voice',
    tabHome: 'Home',
    tabTalk: 'Talk',
    tabLearn: 'Learn',
    tabQuiz: 'Quiz',
    tabWrite: 'Write',
    tabMusic: 'Music',
    sentenceHint: '👇 Tap pictures to talk',
    numbersShown: 'Showing numbers',
    quizPrompt: (w) => `Where is ${w}?`,
    praise: 'Very good!',
    tryAgain: 'Try again!',
    notEnoughWords: 'Not enough words in this category to practise. Pick another one!',
    first: 'First',
    then: 'Then',
    videoWarn: 'One minute left!',
    videoOver: 'Video time is over for today!',
    breatheIn: 'Breathe in',
    breatheHold: 'Hold',
    breatheOut: 'Breathe out',
    whichOne: 'Which one?',
  },
  hi: {
    tagline: 'मेरी आवाज़',
    tabHome: 'होम',
    tabTalk: 'बात',
    tabLearn: 'सीखो',
    tabQuiz: 'खेलो',
    tabWrite: 'लिखो',
    tabMusic: 'संगीत',
    sentenceHint: '👇 बोलने के लिए चित्र दबाओ',
    numbersShown: 'दिख रहे अंक',
    quizPrompt: (w) => `${w} कहाँ है?`,
    praise: 'शाबाश!',
    tryAgain: 'फिर से कोशिश करो',
    notEnoughWords: 'इस श्रेणी में अभ्यास के लिए पर्याप्त शब्द नहीं हैं।',
    first: 'पहले',
    then: 'फिर',
    videoWarn: 'एक मिनट बचा है!',
    videoOver: 'आज के लिए वीडियो का समय खत्म!',
    breatheIn: 'साँस लो',
    breatheHold: 'रोको',
    breatheOut: 'साँस छोड़ो',
    whichOne: 'कौन सा?',
  },
  te: {
    tagline: 'నా గొంతు',
    tabHome: 'హోమ్',
    tabTalk: 'మాట',
    tabLearn: 'నేర్చుకో',
    tabQuiz: 'ఆడు',
    tabWrite: 'రాయి',
    tabMusic: 'సంగీతం',
    sentenceHint: '👇 మాట్లాడటానికి బొమ్మలు నొక్కండి',
    numbersShown: 'చూపిస్తున్న సంఖ్యలు',
    quizPrompt: (w) => `${w} ఎక్కడ ఉంది?`,
    praise: 'శభాష్!',
    tryAgain: 'మళ్ళీ ప్రయత్నించు',
    notEnoughWords: 'ఈ విభాగంలో సాధన చేయడానికి సరిపడా పదాలు లేవు.',
    first: 'ముందు',
    then: 'తర్వాత',
    videoWarn: 'ఒక నిమిషం మిగిలింది!',
    videoOver: 'ఈరోజుకి వీడియో సమయం అయిపోయింది!',
    breatheIn: 'ఊపిరి తీసుకో',
    breatheHold: 'ఆగు',
    breatheOut: 'ఊపిరి వదులు',
    whichOne: 'ఏది కావాలి?',
  },
  ta: {
    tagline: 'என் குரல்',
    tabHome: 'ஹோம்',
    tabTalk: 'பேசு',
    tabLearn: 'கற்க',
    tabQuiz: 'விளையாடு',
    tabWrite: 'எழுது',
    tabMusic: 'இசை',
    sentenceHint: '👇 பேச படங்களைத் தொடவும்',
    numbersShown: 'காட்டப்படும் எண்கள்',
    quizPrompt: (w) => `${w} எங்கே?`,
    praise: 'சபாஷ்!',
    tryAgain: 'மீண்டும் முயற்சி செய்',
    notEnoughWords: 'இந்தப் பிரிவில் பயிற்சிக்கு போதுமான சொற்கள் இல்லை.',
    first: 'முதலில்',
    then: 'பிறகு',
    videoWarn: 'ஒரு நிமிடம் மீதம்!',
    videoOver: 'இன்றைக்கு வீடியோ நேரம் முடிந்தது!',
    breatheIn: 'மூச்சை உள்ளே இழு',
    breatheHold: 'நிறுத்து',
    breatheOut: 'மூச்சை வெளியே விடு',
    whichOne: 'எது வேண்டும்?',
  },
  kn: {
    tagline: 'ನನ್ನ ಧ್ವನಿ',
    tabHome: 'ಹೋಮ್',
    tabTalk: 'ಮಾತು',
    tabLearn: 'ಕಲಿ',
    tabQuiz: 'ಆಡು',
    tabWrite: 'ಬರಿ',
    tabMusic: 'ಸಂಗೀತ',
    sentenceHint: '👇 ಮಾತನಾಡಲು ಚಿತ್ರಗಳನ್ನು ಒತ್ತಿ',
    numbersShown: 'ತೋರಿಸುತ್ತಿರುವ ಸಂಖ್ಯೆಗಳು',
    quizPrompt: (w) => `${w} ಎಲ್ಲಿದೆ?`,
    praise: 'ಭೇಷ್!',
    tryAgain: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸು',
    notEnoughWords: 'ಈ ವಿಭಾಗದಲ್ಲಿ ಅಭ್ಯಾಸಕ್ಕೆ ಸಾಕಷ್ಟು ಪದಗಳಿಲ್ಲ.',
    first: 'ಮೊದಲು',
    then: 'ಆಮೇಲೆ',
    videoWarn: 'ಇನ್ನು ಒಂದು ನಿಮಿಷ!',
    videoOver: 'ಇವತ್ತಿಗೆ ವಿಡಿಯೋ ಸಮಯ ಮುಗಿಯಿತು!',
    breatheIn: 'ಉಸಿರು ಒಳಗೆ ತಗೊ',
    breatheHold: 'ನಿಲ್ಲಿಸು',
    breatheOut: 'ಉಸಿರು ಹೊರಗೆ ಬಿಡು',
    whichOne: 'ಯಾವುದು ಬೇಕು?',
  },
  mr: {
    tagline: 'माझा आवाज',
    tabHome: 'होम',
    tabTalk: 'बोल',
    tabLearn: 'शिक',
    tabQuiz: 'खेळ',
    tabWrite: 'लिही',
    tabMusic: 'संगीत',
    sentenceHint: '👇 बोलण्यासाठी चित्रं दाबा',
    numbersShown: 'दाखवलेले अंक',
    quizPrompt: (w) => `${w} कुठे आहे?`,
    praise: 'शाब्बास!',
    tryAgain: 'पुन्हा प्रयत्न कर',
    notEnoughWords: 'या विभागात सरावासाठी पुरेसे शब्द नाहीत.',
    first: 'आधी',
    then: 'मग',
    videoWarn: 'एक मिनिट बाकी!',
    videoOver: 'आजचा व्हिडिओचा वेळ संपला!',
    breatheIn: 'श्वास घे',
    breatheHold: 'थांब',
    breatheOut: 'श्वास सोड',
    whichOne: 'कोणतं?',
  },
  bn: {
    tagline: 'আমার কণ্ঠ',
    tabHome: 'হোম',
    tabTalk: 'কথা',
    tabLearn: 'শেখো',
    tabQuiz: 'খেলো',
    tabWrite: 'লেখো',
    tabMusic: 'গান',
    sentenceHint: '👇 কথা বলতে ছবিতে চাপো',
    numbersShown: 'দেখানো সংখ্যা',
    quizPrompt: (w) => `${w} কোথায়?`,
    praise: 'সাবাশ!',
    tryAgain: 'আবার চেষ্টা করো',
    notEnoughWords: 'এই বিভাগে অনুশীলনের জন্য যথেষ্ট শব্দ নেই।',
    first: 'আগে',
    then: 'পরে',
    videoWarn: 'এক মিনিট বাকি!',
    videoOver: 'আজকের ভিডিওর সময় শেষ!',
    breatheIn: 'শ্বাস নাও',
    breatheHold: 'ধরে রাখো',
    breatheOut: 'শ্বাস ছাড়ো',
    whichOne: 'কোনটা?',
  },
};
