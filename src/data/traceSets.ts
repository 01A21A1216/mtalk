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
