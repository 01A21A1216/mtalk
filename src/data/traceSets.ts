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

const toItems = (pairs: string[][]): TraceItem[] =>
  pairs.map(([glyph, name]) => ({ glyph, name }));

/**
 * Native-script alphabets, offered when that language is active.
 *
 * These are the full school lists — vowels first, then consonants, in the
 * order children are taught them — not a sample. A child working through the
 * alphabet should find every letter here, including the ones that only turn up
 * late (ఱ, ಳ, क्ष, ழ).
 */
export const SCRIPT_SETS: Record<string, TraceSet> = {
  hi: {
    id: 'script-hi',
    emoji: 'अ',
    name: 'हिन्दी',
    color: '#FFF3E0',
    colorDark: '#E65100',
    items: toItems([
      // स्वर — vowels
      ['अ', 'a'], ['आ', 'aa'], ['इ', 'i'], ['ई', 'ee'], ['उ', 'u'], ['ऊ', 'oo'],
      ['ऋ', 'ri'], ['ए', 'e'], ['ऐ', 'ai'], ['ओ', 'o'], ['औ', 'au'],
      ['अं', 'an'], ['अः', 'ah'],
      // व्यंजन — consonants
      ['क', 'ka'], ['ख', 'kha'], ['ग', 'ga'], ['घ', 'gha'], ['ङ', 'nga'],
      ['च', 'cha'], ['छ', 'chha'], ['ज', 'ja'], ['झ', 'jha'], ['ञ', 'nya'],
      ['ट', 'ta'], ['ठ', 'tha'], ['ड', 'da'], ['ढ', 'dha'], ['ण', 'na'],
      ['त', 'ta'], ['थ', 'tha'], ['द', 'da'], ['ध', 'dha'], ['न', 'na'],
      ['प', 'pa'], ['फ', 'pha'], ['ब', 'ba'], ['भ', 'bha'], ['म', 'ma'],
      ['य', 'ya'], ['र', 'ra'], ['ल', 'la'], ['व', 'va'],
      ['श', 'sha'], ['ष', 'shha'], ['स', 'sa'], ['ह', 'ha'],
      ['क्ष', 'ksha'], ['त्र', 'tra'], ['ज्ञ', 'gya'],
    ]),
  },
  te: {
    id: 'script-te',
    emoji: 'అ',
    name: 'తెలుగు',
    color: '#E0F2F1',
    colorDark: '#00695C',
    items: toItems([
      // అచ్చులు — vowels
      ['అ', 'a'], ['ఆ', 'aa'], ['ఇ', 'i'], ['ఈ', 'ee'], ['ఉ', 'u'], ['ఊ', 'oo'],
      ['ఋ', 'ru'], ['ౠ', 'ruu'], ['ఎ', 'e'], ['ఏ', 'ay'], ['ఐ', 'ai'],
      ['ఒ', 'o'], ['ఓ', 'oh'], ['ఔ', 'au'], ['అం', 'am'], ['అః', 'aha'],
      // హల్లులు — consonants
      ['క', 'ka'], ['ఖ', 'kha'], ['గ', 'ga'], ['ఘ', 'gha'], ['ఙ', 'nga'],
      ['చ', 'cha'], ['ఛ', 'chha'], ['జ', 'ja'], ['ఝ', 'jha'], ['ఞ', 'nya'],
      ['ట', 'ta'], ['ఠ', 'tha'], ['డ', 'da'], ['ఢ', 'dha'], ['ణ', 'na'],
      ['త', 'ta'], ['థ', 'tha'], ['ద', 'da'], ['ధ', 'dha'], ['న', 'na'],
      ['ప', 'pa'], ['ఫ', 'pha'], ['బ', 'ba'], ['భ', 'bha'], ['మ', 'ma'],
      ['య', 'ya'], ['ర', 'ra'], ['ల', 'la'], ['వ', 'va'],
      ['శ', 'sha'], ['ష', 'shha'], ['స', 'sa'], ['హ', 'ha'],
      ['ళ', 'lla'], ['క్ష', 'ksha'], ['ఱ', 'rra'],
    ]),
  },
  ta: {
    id: 'script-ta',
    emoji: 'அ',
    name: 'தமிழ்',
    color: '#FCE4EC',
    colorDark: '#AD1457',
    items: toItems([
      // உயிர் எழுத்து — vowels
      ['அ', 'a'], ['ஆ', 'aa'], ['இ', 'i'], ['ஈ', 'ee'], ['உ', 'u'], ['ஊ', 'oo'],
      ['எ', 'e'], ['ஏ', 'ay'], ['ஐ', 'ai'], ['ஒ', 'o'], ['ஓ', 'oh'], ['ஔ', 'au'],
      ['ஃ', 'akh'],
      // மெய் எழுத்து — consonants, shown in their base form for tracing
      ['க', 'ka'], ['ங', 'nga'], ['ச', 'cha'], ['ஞ', 'nya'], ['ட', 'ta'],
      ['ண', 'na'], ['த', 'tha'], ['ந', 'na'], ['ப', 'pa'], ['ம', 'ma'],
      ['ய', 'ya'], ['ர', 'ra'], ['ல', 'la'], ['வ', 'va'], ['ழ', 'zha'],
      ['ள', 'lla'], ['ற', 'rra'], ['ன', 'nna'],
      // கிரந்த எழுத்து — Grantha letters, used in borrowed words
      ['ஜ', 'ja'], ['ஸ', 'sa'], ['ஷ', 'sha'], ['ஹ', 'ha'], ['க்ஷ', 'ksha'],
    ]),
  },
  kn: {
    id: 'script-kn',
    emoji: 'ಅ',
    name: 'ಕನ್ನಡ',
    color: '#E8EAF6',
    colorDark: '#283593',
    items: toItems([
      // ಸ್ವರಗಳು — vowels
      ['ಅ', 'a'], ['ಆ', 'aa'], ['ಇ', 'i'], ['ಈ', 'ee'], ['ಉ', 'u'], ['ಊ', 'oo'],
      ['ಋ', 'ru'], ['ಎ', 'e'], ['ಏ', 'ay'], ['ಐ', 'ai'], ['ಒ', 'o'], ['ಓ', 'oh'],
      ['ಔ', 'au'], ['ಅಂ', 'am'], ['ಅಃ', 'ah'],
      // ವ್ಯಂಜನಗಳು — consonants
      ['ಕ', 'ka'], ['ಖ', 'kha'], ['ಗ', 'ga'], ['ಘ', 'gha'], ['ಙ', 'nga'],
      ['ಚ', 'cha'], ['ಛ', 'chha'], ['ಜ', 'ja'], ['ಝ', 'jha'], ['ಞ', 'nya'],
      ['ಟ', 'ta'], ['ಠ', 'tha'], ['ಡ', 'da'], ['ಢ', 'dha'], ['ಣ', 'na'],
      ['ತ', 'ta'], ['ಥ', 'tha'], ['ದ', 'da'], ['ಧ', 'dha'], ['ನ', 'na'],
      ['ಪ', 'pa'], ['ಫ', 'pha'], ['ಬ', 'ba'], ['ಭ', 'bha'], ['ಮ', 'ma'],
      ['ಯ', 'ya'], ['ರ', 'ra'], ['ಲ', 'la'], ['ವ', 'va'],
      ['ಶ', 'sha'], ['ಷ', 'shha'], ['ಸ', 'sa'], ['ಹ', 'ha'], ['ಳ', 'lla'],
    ]),
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
    id: 'letters-small',
    emoji: '🔡',
    name: 'small letters',
    color: '#E1F5FE',
    colorDark: '#0277BD',
    items: 'abcdefghijklmnopqrstuvwxyz'
      .split('')
      .map((l) => ({ glyph: l, name: `${l} (small ${l.toUpperCase()})` })),
  },
  {
    id: 'numbers',
    emoji: '🔢',
    name: 'Numbers',
    color: '#FFE8CC',
    colorDark: '#E65100',
    // 0–100: single digits first, then the two- and three-digit numbers a
    // child meets next. Tracing 47 is a different skill from tracing 4 and 7.
    items: Array.from({ length: 101 }, (_, n) => ({
      glyph: String(n),
      name: String(n),
    })),
  },
  {
    id: 'shapes',
    emoji: '⭐',
    name: 'Shapes',
    color: '#FFF6C9',
    colorDark: '#F9A825',
    // Outline glyphs only, so they trace like letters rather than colouring in
    items: [
      { glyph: '○', name: 'Circle' },
      { glyph: '△', name: 'Triangle' },
      { glyph: '□', name: 'Square' },
      { glyph: '▭', name: 'Rectangle' },
      { glyph: '☆', name: 'Star' },
      { glyph: '♡', name: 'Heart' },
      { glyph: '◇', name: 'Diamond' },
      { glyph: '⬭', name: 'Oval' },
      { glyph: '▽', name: 'Upside-down triangle' },
      { glyph: '⬠', name: 'Pentagon' },
      { glyph: '⬡', name: 'Hexagon' },
      { glyph: '▱', name: 'Slanted box' },
      { glyph: '⏢', name: 'Trapezium' },
      { glyph: '◐', name: 'Half circle' },
      { glyph: '✚', name: 'Cross' },
      { glyph: '▷', name: 'Arrow head' },
    ],
  },
  {
    id: 'symbols',
    emoji: '➕',
    name: 'Symbols',
    color: '#E8D6FF',
    colorDark: '#6A1B9A',
    // Maths first, then the marks a child meets in writing — ₹ included
    // because rupees turn up long before percentages do
    items: [
      { glyph: '+', name: 'Plus' },
      { glyph: '−', name: 'Minus' },
      { glyph: '×', name: 'Times' },
      { glyph: '÷', name: 'Divide' },
      { glyph: '=', name: 'Equals' },
      { glyph: '≠', name: 'Not equal' },
      { glyph: '<', name: 'Less than' },
      { glyph: '>', name: 'Greater than' },
      { glyph: '%', name: 'Percent' },
      { glyph: '√', name: 'Square root' },
      { glyph: '₹', name: 'Rupee' },
      { glyph: '✓', name: 'Tick' },
      { glyph: '✗', name: 'Cross' },
      { glyph: '?', name: 'Question mark' },
      { glyph: '!', name: 'Exclamation mark' },
      { glyph: '.', name: 'Full stop' },
      { glyph: ',', name: 'Comma' },
      { glyph: ':', name: 'Colon' },
      { glyph: ';', name: 'Semicolon' },
      { glyph: "'", name: 'Apostrophe' },
      { glyph: '"', name: 'Quotation marks' },
      { glyph: '(', name: 'Open bracket' },
      { glyph: ')', name: 'Close bracket' },
      { glyph: '&', name: 'And' },
      { glyph: '@', name: 'At' },
      { glyph: '#', name: 'Hash' },
      { glyph: '→', name: 'Arrow' },
      { glyph: '↑', name: 'Up arrow' },
      { glyph: '↓', name: 'Down arrow' },
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
    // Animals a child here actually meets or hears about, before the zoo ones.
    // Kept to long-established emoji so they render on older tablets.
    items: [
      { glyph: '🐶', name: 'Dog' },
      { glyph: '🐱', name: 'Cat' },
      { glyph: '🐄', name: 'Cow' },
      { glyph: '🐃', name: 'Buffalo' },
      { glyph: '🐐', name: 'Goat' },
      { glyph: '🐑', name: 'Sheep' },
      { glyph: '🐴', name: 'Horse' },
      { glyph: '🐪', name: 'Camel' },
      { glyph: '🐘', name: 'Elephant' },
      { glyph: '🐯', name: 'Tiger' },
      { glyph: '🦁', name: 'Lion' },
      { glyph: '🐵', name: 'Monkey' },
      { glyph: '🐰', name: 'Rabbit' },
      { glyph: '🐭', name: 'Mouse' },
      { glyph: '🐿️', name: 'Squirrel' },
      { glyph: '🐷', name: 'Pig' },
      { glyph: '🦌', name: 'Deer' },
      { glyph: '🐻', name: 'Bear' },
      { glyph: '🦒', name: 'Giraffe' },
      { glyph: '🦓', name: 'Zebra' },
      { glyph: '🦚', name: 'Peacock' },
      { glyph: '🦜', name: 'Parrot' },
      { glyph: '🐦', name: 'Bird' },
      { glyph: '🐓', name: 'Rooster' },
      { glyph: '🦆', name: 'Duck' },
      { glyph: '🦉', name: 'Owl' },
      { glyph: '🐧', name: 'Penguin' },
      { glyph: '🐍', name: 'Snake' },
      { glyph: '🐊', name: 'Crocodile' },
      { glyph: '🐸', name: 'Frog' },
      { glyph: '🐢', name: 'Turtle' },
      { glyph: '🐟', name: 'Fish' },
      { glyph: '🐬', name: 'Dolphin' },
      { glyph: '🦋', name: 'Butterfly' },
      { glyph: '🐝', name: 'Bee' },
      { glyph: '🐜', name: 'Ant' },
      { glyph: '🐌', name: 'Snail' },
    ],
  },
  {
    id: 'vehicles',
    emoji: '🚌',
    name: 'Vehicles',
    color: '#E1F5FE',
    colorDark: '#0277BD',
    // Big ghosts to colour in — the ones on an Indian street first, then the
    // ones a child only ever sees in the sky or on a screen
    emojiGhost: true,
    items: [
      { glyph: '🛺', name: 'Auto' },
      { glyph: '🚌', name: 'Bus' },
      { glyph: '🚗', name: 'Car' },
      { glyph: '🚕', name: 'Taxi' },
      { glyph: '🚙', name: 'Jeep' },
      { glyph: '🛵', name: 'Scooter' },
      { glyph: '🏍️', name: 'Motorbike' },
      { glyph: '🚲', name: 'Cycle' },
      { glyph: '🚚', name: 'Truck' },
      { glyph: '🚛', name: 'Lorry' },
      { glyph: '🚜', name: 'Tractor' },
      { glyph: '🚑', name: 'Ambulance' },
      { glyph: '🚒', name: 'Fire engine' },
      { glyph: '🚓', name: 'Police car' },
      { glyph: '🚐', name: 'Van' },
      { glyph: '🚂', name: 'Train' },
      { glyph: '🚆', name: 'Express train' },
      { glyph: '🚇', name: 'Metro' },
      { glyph: '🚊', name: 'Tram' },
      { glyph: '✈️', name: 'Aeroplane' },
      { glyph: '🚁', name: 'Helicopter' },
      { glyph: '🚀', name: 'Rocket' },
      { glyph: '⛵', name: 'Sail boat' },
      { glyph: '🚤', name: 'Speed boat' },
      { glyph: '🚢', name: 'Ship' },
      { glyph: '🛴', name: 'Kick scooter' },
    ],
  },
  {
    id: 'cartoons',
    emoji: '😀',
    name: 'Cartoons',
    color: '#FFD6E8',
    colorDark: '#E91E8C',
    emojiGhost: true,
    /**
     * Characters a child can colour in. These are emoji, not licensed cartoon
     * characters — Chhota Bheem, Doraemon and the rest are somebody's
     * copyright, and an app for children is the last place to borrow them.
     */
    items: [
      // faces and folk
      { glyph: '😀', name: 'Happy face' },
      { glyph: '😍', name: 'Love face' },
      { glyph: '😴', name: 'Sleepy face' },
      { glyph: '🤖', name: 'Robot' },
      { glyph: '👻', name: 'Ghost' },
      { glyph: '👽', name: 'Alien' },
      { glyph: '🤡', name: 'Clown' },
      { glyph: '👸', name: 'Princess' },
      { glyph: '🤴', name: 'Prince' },
      { glyph: '🧚', name: 'Fairy' },
      { glyph: '🧙', name: 'Wizard' },
      { glyph: '🧜', name: 'Mermaid' },
      // creatures
      { glyph: '🦄', name: 'Unicorn' },
      { glyph: '🐲', name: 'Dragon' },
      { glyph: '🦖', name: 'Dinosaur' },
      { glyph: '🦕', name: 'Long-neck dinosaur' },
      { glyph: '🐙', name: 'Octopus' },
      { glyph: '🐼', name: 'Panda' },
      { glyph: '🐥', name: 'Chick' },
      { glyph: '🧸', name: 'Teddy bear' },
      { glyph: '⛄', name: 'Snowman' },
      { glyph: '🎃', name: 'Pumpkin' },
      // things that go
      { glyph: '🚗', name: 'Car' },
      { glyph: '🚌', name: 'Bus' },
      { glyph: '🚂', name: 'Train' },
      { glyph: '✈️', name: 'Aeroplane' },
      { glyph: '🚁', name: 'Helicopter' },
      { glyph: '🚀', name: 'Rocket' },
      { glyph: '⛵', name: 'Boat' },
      // happy things
      { glyph: '🌈', name: 'Rainbow' },
      { glyph: '⭐', name: 'Star' },
      { glyph: '🌙', name: 'Moon' },
      { glyph: '☀️', name: 'Sun' },
      { glyph: '🍄', name: 'Mushroom' },
      { glyph: '🎈', name: 'Balloon' },
      { glyph: '🎁', name: 'Gift' },
      { glyph: '🎂', name: 'Cake' },
      { glyph: '🍦', name: 'Ice cream' },
      { glyph: '🏰', name: 'Castle' },
      { glyph: '🎪', name: 'Circus tent' },
    ],
  },
];
