/**
 * Taught two-word combinations.
 *
 * The hard jump in AAC is not the first word, it is the second. A child who
 * has "juice" can name a drink; a child who has "more juice" can run their own
 * afternoon.
 *
 * The board already learns which word follows which from the child's own
 * sentences, but that has a cold start it cannot escape on its own: a child who
 * cannot yet combine never produces the pairs the prediction needs, so the
 * suggestion row stays empty exactly for the children it would help most.
 * These are the patterns to seed it with — core word first, likely partners
 * after, in the order they are worth offering.
 *
 * Every id here is checked against the vocabulary by `comboPartners`, so a
 * word that gets renamed goes quiet rather than pointing at nothing.
 */

/** Word ids worth starting a sentence with — offered before the first tap */
export const COMBO_STARTERS = [
  'want',
  'more',
  'go',
  'stop',
  'help',
  'again',
  'f-mine',
  'finish',
];

/**
 * First word id → partner ids, best first.
 *
 * Partners are things a child in an Indian home actually asks for, and the
 * patterns are the ones that appear earliest in real AAC use: request
 * (want + thing), repeat (more/again + thing), refuse (stop/no + thing),
 * possess (mine + thing), and go + place.
 */
export const COMBOS: Record<string, string[]> = {
  // request
  want: ['water', 'milk', 'biscuit', 'juice', 'banana', 'toys', 'tv', 'outside'],
  give: ['ball', 'toys', 'water', 'biscuit', 'phone', 'book'],
  eat: ['roti', 'rice', 'banana', 'biscuit', 'curd', 'sweets'],
  drink: ['water', 'milk', 'juice'],

  // repeat — the two words a child asks for most and is offered least
  more: ['water', 'milk', 'biscuit', 'juice', 'play', 'swing', 'music', 'tv'],
  again: ['play', 'swing', 'bubbles', 'music', 'tv', 'drawing', 'singing'],

  // refuse and end
  stop: ['music', 'tv', 'swing', 'bath', 'homework'],
  no: ['bath', 'homework', 'sleep', 'medicine', 'toilet'],
  finish: ['eat', 'bath', 'homework', 'play', 'tv'],
  quiet: ['tv', 'music'],

  // possess and point
  'f-mine': ['toys', 'ball', 'book', 'bag', 'phone', 'cycle'],
  myturn: ['play', 'ball', 'swing', 'cycle', 'toys'],
  'f-this': ['want', 'more', 'eat', 'play'],
  'f-that': ['want', 'more', 'look'],

  // go somewhere
  go: ['home', 'park', 'school', 'outside', 'shop', 'temple', 'toilet'],
  come: ['amma', 'appa', 'sister', 'brother', 'friend'],

  // people doing things — the pattern that starts real sentences
  amma: ['come', 'look', 'help', 'go', 'play'],
  appa: ['come', 'look', 'help', 'go', 'play'],
  teacher: ['come', 'look', 'help'],
  friend: ['come', 'play', 'look'],

  // ask for help with something
  help: ['open', 'wash', 'eat', 'toilet', 'bath', 'homework'],
  open: ['book', 'bag', 'phone', 'toys'],
  look: ['ball', 'toys', 'book', 'tv', 'outside'],

  // feelings paired with a cause, so a report becomes a request
  pain: ['head', 'tummy', 'teeth', 'ear', 'leg', 'hand'],
  hungry: ['roti', 'rice', 'banana', 'biscuit'],
  thirsty: ['water', 'milk', 'juice'],
  tired: ['sleep', 'home', 'break'],
  scared: ['amma', 'appa', 'home', 'hug'],
  play: ['ball', 'toys', 'bubbles', 'blocks', 'outside', 'cycle'],
};

/**
 * Partner ids taught for a first word, filtered to words that really exist.
 *
 * `has` is the board's own word index, so a partner the child cannot see on
 * their board is never suggested to them.
 */
export function comboPartners(
  firstId: string,
  has: (id: string) => boolean,
  limit: number,
): string[] {
  return (COMBOS[firstId] ?? []).filter(has).slice(0, limit);
}

/** Core words worth offering at the start of a sentence */
export function comboStarters(has: (id: string) => boolean, limit: number): string[] {
  return COMBO_STARTERS.filter(has).slice(0, limit);
}
