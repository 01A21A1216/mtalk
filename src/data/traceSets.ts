/** Tracing categories for the ✍️ Write tab (shown in the left sidebar) */

export interface TraceItem {
  glyph: string;
  name: string;
}

export interface TraceSet {
  id: string;
  emoji: string;
  name: string;
  color: string;
  colorDark: string;
  /** emoji ghosts are shown faded (no outline) so kids colour them in */
  emojiGhost?: boolean;
  items: TraceItem[];
}

/** Native-script alphabets, offered when that language is active */
export const SCRIPT_SETS: Record<string, TraceSet> = {
  hi: {
    id: 'script-hi',
    emoji: 'अ',
    name: 'हिन्दी',
    color: '#FFF3E0',
    colorDark: '#E65100',
    items: [
      ['अ', 'a'], ['आ', 'aa'], ['इ', 'i'], ['ई', 'ee'], ['उ', 'u'], ['ऊ', 'oo'],
      ['ए', 'e'], ['ऐ', 'ai'], ['ओ', 'o'], ['औ', 'au'], ['क', 'ka'], ['ख', 'kha'],
      ['ग', 'ga'], ['घ', 'gha'], ['च', 'cha'], ['छ', 'chha'], ['ज', 'ja'], ['ट', 'ta'],
      ['ड', 'da'], ['त', 'ta'], ['द', 'da'], ['न', 'na'], ['प', 'pa'], ['ब', 'ba'],
      ['म', 'ma'], ['य', 'ya'], ['र', 'ra'], ['ल', 'la'], ['व', 'va'], ['स', 'sa'],
      ['ह', 'ha'],
    ].map(([glyph, name]) => ({ glyph, name })),
  },
  te: {
    id: 'script-te',
    emoji: 'అ',
    name: 'తెలుగు',
    color: '#E0F2F1',
    colorDark: '#00695C',
    items: [
      ['అ', 'a'], ['ఆ', 'aa'], ['ఇ', 'i'], ['ఈ', 'ee'], ['ఉ', 'u'], ['ఊ', 'oo'],
      ['ఎ', 'e'], ['ఏ', 'ay'], ['ఐ', 'ai'], ['ఒ', 'o'], ['ఓ', 'oh'], ['క', 'ka'],
      ['ఖ', 'kha'], ['గ', 'ga'], ['చ', 'cha'], ['జ', 'ja'], ['ట', 'ta'], ['డ', 'da'],
      ['త', 'ta'], ['ద', 'da'], ['న', 'na'], ['ప', 'pa'], ['బ', 'ba'], ['మ', 'ma'],
      ['య', 'ya'], ['ర', 'ra'], ['ల', 'la'], ['వ', 'va'], ['స', 'sa'], ['హ', 'ha'],
    ].map(([glyph, name]) => ({ glyph, name })),
  },
  ta: {
    id: 'script-ta',
    emoji: 'அ',
    name: 'தமிழ்',
    color: '#FCE4EC',
    colorDark: '#AD1457',
    items: [
      ['அ', 'a'], ['ஆ', 'aa'], ['இ', 'i'], ['ஈ', 'ee'], ['உ', 'u'], ['ஊ', 'oo'],
      ['எ', 'e'], ['ஏ', 'ay'], ['ஐ', 'ai'], ['ஒ', 'o'], ['ஓ', 'oh'], ['க', 'ka'],
      ['ங', 'nga'], ['ச', 'cha'], ['ஞ', 'nya'], ['ட', 'ta'], ['ண', 'na'], ['த', 'tha'],
      ['ந', 'na'], ['ப', 'pa'], ['ம', 'ma'], ['ய', 'ya'], ['ர', 'ra'], ['ல', 'la'],
      ['வ', 'va'], ['ழ', 'zha'], ['ள', 'la'], ['ற', 'ra'], ['ன', 'na'],
    ].map(([glyph, name]) => ({ glyph, name })),
  },
  kn: {
    id: 'script-kn',
    emoji: 'ಅ',
    name: 'ಕನ್ನಡ',
    color: '#E8EAF6',
    colorDark: '#283593',
    items: [
      ['ಅ', 'a'], ['ಆ', 'aa'], ['ಇ', 'i'], ['ಈ', 'ee'], ['ಉ', 'u'], ['ಊ', 'oo'],
      ['ಎ', 'e'], ['ಏ', 'ay'], ['ಐ', 'ai'], ['ಒ', 'o'], ['ಓ', 'oh'], ['ಕ', 'ka'],
      ['ಖ', 'kha'], ['ಗ', 'ga'], ['ಚ', 'cha'], ['ಜ', 'ja'], ['ಟ', 'ta'], ['ಡ', 'da'],
      ['ತ', 'ta'], ['ದ', 'da'], ['ನ', 'na'], ['ಪ', 'pa'], ['ಬ', 'ba'], ['ಮ', 'ma'],
      ['ಯ', 'ya'], ['ರ', 'ra'], ['ಲ', 'la'], ['ವ', 'va'], ['ಸ', 'sa'], ['ಹ', 'ha'],
    ].map(([glyph, name]) => ({ glyph, name })),
  },
};

export const TRACE_SETS: TraceSet[] = [
  {
    id: 'letters',
    emoji: '🔤',
    name: 'Letters',
    color: '#E3F2FD',
    colorDark: '#1565C0',
    items: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => ({ glyph: l, name: l })),
  },
  {
    id: 'numbers',
    emoji: '🔢',
    name: 'Numbers',
    color: '#FFE8CC',
    colorDark: '#E65100',
    items: '0123456789'.split('').map((n) => ({ glyph: n, name: n })),
  },
  {
    id: 'shapes',
    emoji: '⭐',
    name: 'Shapes',
    color: '#FFF6C9',
    colorDark: '#F9A825',
    items: [
      { glyph: '○', name: 'Circle' },
      { glyph: '△', name: 'Triangle' },
      { glyph: '□', name: 'Square' },
      { glyph: '☆', name: 'Star' },
      { glyph: '♡', name: 'Heart' },
      { glyph: '◇', name: 'Diamond' },
    ],
  },
  {
    id: 'symbols',
    emoji: '➕',
    name: 'Symbols',
    color: '#E8D6FF',
    colorDark: '#6A1B9A',
    items: [
      { glyph: '+', name: 'Plus' },
      { glyph: '−', name: 'Minus' },
      { glyph: '×', name: 'Times' },
      { glyph: '÷', name: 'Divide' },
      { glyph: '=', name: 'Equals' },
      { glyph: '?', name: 'Question mark' },
      { glyph: '!', name: 'Exclamation mark' },
      { glyph: '♪', name: 'Music note' },
    ],
  },
  {
    id: 'animals',
    emoji: '🐘',
    name: 'Animals',
    color: '#EFEBE9',
    colorDark: '#4E342E',
    emojiGhost: true,
    items: [
      { glyph: '🐶', name: 'Dog' },
      { glyph: '🐱', name: 'Cat' },
      { glyph: '🐘', name: 'Elephant' },
      { glyph: '🦁', name: 'Lion' },
      { glyph: '🐰', name: 'Rabbit' },
      { glyph: '🐦', name: 'Bird' },
      { glyph: '🐟', name: 'Fish' },
      { glyph: '🦋', name: 'Butterfly' },
      { glyph: '🐢', name: 'Turtle' },
      { glyph: '🐄', name: 'Cow' },
    ],
  },
  {
    id: 'cartoons',
    emoji: '😀',
    name: 'Cartoons',
    color: '#FFD6E8',
    colorDark: '#E91E8C',
    emojiGhost: true,
    items: [
      { glyph: '😀', name: 'Happy face' },
      { glyph: '🤖', name: 'Robot' },
      { glyph: '👻', name: 'Ghost' },
      { glyph: '🦄', name: 'Unicorn' },
      { glyph: '🐼', name: 'Panda' },
      { glyph: '🧸', name: 'Teddy bear' },
      { glyph: '⛄', name: 'Snowman' },
      { glyph: '🎃', name: 'Pumpkin' },
      { glyph: '🐥', name: 'Chick' },
      { glyph: '🚗', name: 'Car' },
    ],
  },
];
