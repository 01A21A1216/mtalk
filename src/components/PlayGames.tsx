import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { playPop, speakAsync, wordText } from '../services/speech';
import { letterIndex } from '../services/scriptLetters';
import type { AgeMode, Language, Word } from '../types';

/**
 * Two wordless thinking games, played with the child's own tiles.
 *
 * Neither game can be lost. A wrong tap dims that picture and leaves the
 * answer on screen to be found — there is no buzzer, no score shown to the
 * child, and no timer anywhere. Nothing on the board unlocks by playing these:
 * a child's words are never a prize for performing.
 *
 * Both are deliberately silent about what to do. The target is simply shown,
 * which a child who does not yet map spoken words can still act on.
 */

export type PlayGame = 'find' | 'pairs' | 'touch' | 'odd' | 'count' | 'order' | 'letter';

interface PlayGamesProps {
  game: PlayGame;
  /** the words showing on the child's board right now — their own tiles */
  words: Word[];
  language: Language;
  rate: number;
  ageMode: AgeMode;
  onRound: (game: PlayGame, level: number) => void;
  onCelebrate: () => void;
  /** switch-access: highlight one cell at a time, tap anywhere to take it */
  scanning: boolean;
  /** how long each cell stays lit, from the child's own setting */
  scanMs: number;
  /** steps of the child's own day, for What comes next */
  scheduleWords: Word[];
  /** the child's categories, for Odd one out */
  categories: { id: string; words: Word[] }[];
  /** one … ten, so How many can say the number in the child's language */
  numberWords: Word[];
}

/** Biggest a picture ever gets: past this they stop reading as a set of choices */
const MAX_CELL = 168;

/**
 * Measures the space the grid has been given and picks the arrangement that
 * makes the pictures biggest.
 *
 * Every column count is tried, because the best shape depends on the box: on a
 * wide screen twelve pictures want four across, on a tablet held upright they
 * want three, and hardcoding either wastes half the screen. CSS cannot do this
 * — a flex child has no definite size to divide up until it is laid out — so
 * the box is measured.
 */
function useCellGrid(count: number) {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [grid, setGrid] = useState({ cols: 2, cell: 0 });

  useEffect(() => {
    if (!box || count < 1) return;
    const measure = () => {
      const { clientWidth: w, clientHeight: h } = box;
      if (!w || !h) return;
      const gap = Math.round(Math.min(14, Math.max(5, Math.min(w, h) * 0.02)));
      let best = { cols: count, cell: 0 };
      for (let cols = 1; cols <= count; cols++) {
        const rows = Math.ceil(count / cols);
        const cell = Math.min(
          (w - (cols - 1) * gap) / cols,
          (h - (rows - 1) * gap) / rows,
          MAX_CELL,
        );
        if (cell > best.cell) best = { cols, cell };
      }
      setGrid({ cols: best.cols, cell: Math.max(44, Math.floor(best.cell)) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [box, count]);

  return { ref: setBox, ...grid };
}

/**
 * Switch access for the games.
 *
 * A child who cannot point still has to be able to play, so the lit cell walks
 * the grid on a timer and any tap at all takes whichever one is lit. The board
 * has done this since v1.4; without it here, the Play tab quietly excluded the
 * children with the least movement.
 */
function useScan(
  active: boolean,
  count: number,
  everyMs: number,
  onPick: (index: number) => void,
) {
  const [index, setIndex] = useState(0);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    if (!active || count < 1) return;
    setIndex(0);
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), everyMs);
    return () => window.clearInterval(timer);
  }, [active, count, everyMs]);

  /** put on the game's own container: any tap takes the lit cell */
  const takeLit = (e: React.MouseEvent) => {
    if (!active || count < 1) return;
    e.preventDefault();
    e.stopPropagation();
    pick.current(index % count);
  };

  return { scanIndex: active ? index % count : -1, takeLit };
}

type GameProps = Omit<PlayGamesProps, 'game'>;

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** What the child actually sees on a tile: the photo if there is one, else the emoji */
function pictureKey(word: Word): string {
  return word.image || word.emoji;
}

/**
 * One word per distinct picture.
 *
 * Several words share an emoji — "yes" and the First-100 "yes" are both 👍 —
 * and two identical pictures on screen would mean two right-looking answers
 * with only one accepted. In a game that cannot be lost, that is the one way
 * left to make a child feel wrong.
 */
function distinctPictures(words: Word[]): Word[] {
  const seen = new Set<string>();
  return words.filter((w) => {
    const key = pictureKey(w);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The picture on a tile — a parent's photo when there is one, else the emoji */
function Picture({ word, className }: { word: Word; className: string }) {
  return word.image ? (
    <img src={word.image} alt="" className={`${className}-img`} />
  ) : (
    <span className={`${className}-emoji`}>{word.emoji}</span>
  );
}

/* ------------------------------------------------------------------ find it */

/** Tiles on screen, easiest first. Grows only when the child is finding it. */
const FIND_LEVELS = [2, 4, 6, 9, 12];

function FindIt({ words, language, rate, ageMode, onRound, onCelebrate }: GameProps) {
  // a younger child starts with fewer pictures to sweep across
  const startLevel = ageMode === 1 ? 0 : ageMode === 2 ? 1 : 2;
  const [level, setLevel] = useState(startLevel);
  const [target, setTarget] = useState<Word | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [missed, setMissed] = useState<string[]>([]);
  const [found, setFound] = useState(false);
  const streak = useRef(0);
  const busy = useRef(false);

  const pool = distinctPictures(words);
  /*
   * The word list arrives as a fresh array on every render of the app, so
   * anything keyed on its identity would restart the game each time a round
   * is recorded — the child would never get past the easiest level. Key on
   * what is actually in it instead.
   */
  const wordKey = pool.map((w) => w.id).join(',');
  const poolRef = useRef(pool);
  poolRef.current = pool;
  const { ref: board, cols, cell } = useCellGrid(Math.max(1, options.length));
  const gridStyle = {
    '--cols': cols,
    '--cell': `${cell}px`,
  } as React.CSSProperties;

  const deal = useCallback((atLevel: number) => {
    const current = poolRef.current;
    const count = Math.min(FIND_LEVELS[atLevel], current.length);
    const picked = shuffle(current).slice(0, count);
    setOptions(picked);
    setTarget(picked[Math.floor(Math.random() * picked.length)]);
    setMissed([]);
    setFound(false);
    busy.current = false;
  }, []);

  useEffect(() => {
    streak.current = 0;
    setLevel(startLevel);
    deal(startLevel);
  }, [wordKey, startLevel, deal]);

  if (pool.length < 2 || !target) return <main className="play" />;

  const tap = (word: Word) => {
    if (busy.current) return;
    if (word.id !== target.id) {
      // errorless: the picture fades out of the way, the answer stays put
      setMissed((prev) => (prev.includes(word.id) ? prev : [...prev, word.id]));
      streak.current = 0;
      return;
    }
    busy.current = true;
    setFound(true);
    playPop();
    onRound('find', FIND_LEVELS[level]);
    // say the word itself rather than "well done" — the picture is the lesson
    void speakAsync(wordText(word, language), language, rate).then(() => {
      const clean = missed.length === 0;
      streak.current = clean ? streak.current + 1 : 0;
      let next = level;
      if (streak.current >= 3 && level < FIND_LEVELS.length - 1) {
        next = level + 1;
        streak.current = 0;
        onCelebrate();
      } else if (missed.length >= 3 && level > 0) {
        // struggling: quietly make it easier again, with nothing said about it
        next = level - 1;
      }
      setLevel(next);
      window.setTimeout(() => deal(next), 500);
    });
  };

  return (
    <main className="play">
      <div className="play-target">
        <Picture word={target} className="play-target" />
      </div>
      <div className="play-board" ref={board}>
        <div className="play-grid" style={gridStyle}>
          {options.map((word) => (
            <button
              key={word.id}
              className={`play-cell ${missed.includes(word.id) ? 'play-cell-missed' : ''} ${
                found && word.id === target.id ? 'play-cell-found' : ''
              }`}
              onClick={() => tap(word)}
              disabled={missed.includes(word.id)}
            >
              <Picture word={word} className="play-cell" />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------- pairs */

const PAIR_LEVELS = [2, 3, 4, 6];

interface Card {
  key: string;
  word: Word;
}

function Pairs({ words, language, rate, ageMode, onRound, onCelebrate }: GameProps) {
  const startLevel = ageMode === 1 ? 0 : ageMode === 2 ? 1 : 2;
  const [level, setLevel] = useState(startLevel);
  const [cards, setCards] = useState<Card[]>([]);
  const [up, setUp] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const busy = useRef(false);

  const pool = distinctPictures(words);
  const wordKey = pool.map((w) => w.id).join(',');
  const poolRef = useRef(pool);
  poolRef.current = pool;
  const { ref: board, cols, cell } = useCellGrid(Math.max(1, cards.length));
  const gridStyle = {
    '--cols': cols,
    '--cell': `${cell}px`,
  } as React.CSSProperties;

  const deal = useCallback((atLevel: number) => {
    const current = poolRef.current;
    const pairs = Math.min(PAIR_LEVELS[atLevel], current.length);
    const picked = shuffle(current).slice(0, pairs);
    setCards(
      shuffle(picked.flatMap((w) => [{ key: `${w.id}-a`, word: w }, { key: `${w.id}-b`, word: w }])),
    );
    setUp([]);
    setMatched([]);
    busy.current = false;
  }, []);

  useEffect(() => {
    setLevel(startLevel);
    deal(startLevel);
  }, [wordKey, startLevel, deal]);

  if (pool.length < 2 || cards.length === 0) return <main className="play" />;

  const tap = (card: Card) => {
    if (busy.current || up.includes(card.key) || matched.includes(card.word.id)) return;
    const nowUp = [...up, card.key];
    setUp(nowUp);
    if (nowUp.length < 2) return;

    const [a, b] = nowUp.map((k) => cards.find((c) => c.key === k)!);
    if (a.word.id === b.word.id) {
      playPop();
      const done = [...matched, a.word.id];
      setMatched(done);
      setUp([]);
      void speakAsync(wordText(a.word, language), language, rate);
      if (done.length === PAIR_LEVELS[level] || done.length * 2 === cards.length) {
        busy.current = true;
        onRound('pairs', PAIR_LEVELS[level]);
        onCelebrate();
        const next = level < PAIR_LEVELS.length - 1 ? level + 1 : level;
        setLevel(next);
        window.setTimeout(() => deal(next), 1200);
      }
      return;
    }
    // no penalty and no noise — the two simply turn back over
    busy.current = true;
    window.setTimeout(() => {
      setUp([]);
      busy.current = false;
    }, 1000);
  };

  return (
    <main className="play play-pairs">
      <div className="play-board" ref={board}>
        <div className="play-grid" style={gridStyle}>
          {cards.map((card) => {
          const open = up.includes(card.key) || matched.includes(card.word.id);
            return (
              <button
                key={card.key}
                className={`play-cell play-card ${open ? 'play-card-open' : ''} ${
                  matched.includes(card.word.id) ? 'play-cell-found' : ''
                }`}
                onClick={() => tap(card)}
              >
                {open ? (
                  <Picture word={card.word} className="play-cell" />
                ) : (
                  <span className="play-card-back">❓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}


/* -------------------------------------------------------------- touch anything */

const TOUCH_COLOURS = ['#FFCDD2', '#C8E6C9', '#BBDEFB', '#FFF9C4', '#E1BEE7', '#FFE0B2'];

/**
 * Cause and effect: every tap does something, and nothing can be wrong.
 *
 * For a child who has not yet learned that they make things happen. It is also
 * the gentlest way into switch use — there is only one thing on screen, so a
 * scanning child never has to wait for the right cell to light up.
 */
function TouchAnything({ words, language, rate, onRound, onCelebrate }: GameProps) {
  const [hits, setHits] = useState(0);
  const pool = distinctPictures(words);
  const word = pool.length ? pool[hits % pool.length] : null;

  const touch = () => {
    playPop();
    const next = hits + 1;
    setHits(next);
    if (word) void speakAsync(wordText(word, language), language, rate);
    onRound('touch', next);
    if (next % 10 === 0) onCelebrate();
  };

  return (
    <main className="play play-touch" onClick={touch}>
      <div
        className="play-touch-blob"
        style={{ background: TOUCH_COLOURS[hits % TOUCH_COLOURS.length] }}
        key={hits}
      >
        <span className="play-touch-emoji">{word ? word.emoji : '\u2b50'}</span>
      </div>
      <p className="play-touch-hint">{word ? wordText(word, language) : ''}</p>
    </main>
  );
}

/* ---------------------------------------------------------------- odd one out */

/**
 * Three from one category and one from another: which does not belong?
 *
 * Categorisation, using the way the child's own board is organised. Needs two
 * categories with enough pictures, so it says so plainly rather than showing
 * an empty screen.
 */
function OddOneOut({ categories, language, rate, onRound, onCelebrate, scanning, scanMs }: GameProps) {
  const [round, setRound] = useState<{ group: Word[]; odd: Word } | null>(null);
  const [missed, setMissed] = useState<string[]>([]);
  const [found, setFound] = useState(false);
  const busy = useRef(false);
  const usable = categories.filter((c) => distinctPictures(c.words).length >= 3);
  const key = usable.map((c) => c.id).join(',');

  const deal = useCallback(() => {
    if (usable.length < 2) return;
    const [a, b] = shuffle(usable).slice(0, 2);
    const group = shuffle(distinctPictures(a.words)).slice(0, 3);
    const odd = shuffle(distinctPictures(b.words).filter((w) => !group.some((g) => pictureKey(g) === pictureKey(w))))[0];
    if (!odd) return;
    setRound({ group, odd });
    setMissed([]);
    setFound(false);
    busy.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    deal();
  }, [deal]);

  const options = round ? shuffle([...round.group, round.odd]) : [];
  const shown = useRef<Word[]>([]);
  if (round && shown.current.length !== 4) shown.current = options;
  if (round && !shown.current.some((w) => w.id === round.odd.id)) shown.current = options;
  const cells = round ? shown.current : [];

  const { ref: board, cols, cell } = useCellGrid(Math.max(1, cells.length));
  const tap = (word: Word) => {
    if (busy.current || !round) return;
    if (word.id !== round.odd.id) {
      setMissed((prev) => (prev.includes(word.id) ? prev : [...prev, word.id]));
      return;
    }
    busy.current = true;
    setFound(true);
    playPop();
    onRound('odd', 4);
    void speakAsync(wordText(word, language), language, rate).then(() => {
      if (missed.length === 0) onCelebrate();
      window.setTimeout(() => {
        shown.current = [];
        deal();
      }, 500);
    });
  };
  const { scanIndex, takeLit } = useScan(scanning, cells.length, scanMs, (i) => tap(cells[i]));

  if (usable.length < 2 || !round) {
    return (
      <main className="play">
        <p className="quiz-empty">
          Turn on a few more categories in Settings and this game has something
          to sort.
        </p>
      </main>
    );
  }

  return (
    <main className="play" onClickCapture={scanning ? takeLit : undefined}>
      <div className="play-board" ref={board}>
        <div className="play-grid" style={{ '--cols': cols, '--cell': `${cell}px` } as React.CSSProperties}>
          {cells.map((word, i) => (
            <button
              key={word.id}
              className={`play-cell ${missed.includes(word.id) ? 'play-cell-missed' : ''} ${
                found && word.id === round.odd.id ? 'play-cell-found' : ''
              } ${i === scanIndex ? 'play-cell-lit' : ''}`}
              onClick={() => tap(word)}
              disabled={missed.includes(word.id)}
            >
              <Picture word={word} className="play-cell" />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

/* --------------------------------------------------------------- how many */

const COUNT_LEVELS = [3, 5, 8, 10];

/**
 * How many are there?
 *
 * Counting to a thousand teaches the *names* of numbers. This teaches what
 * they mean: a handful of the same picture, and the numeral to match.
 */
function HowMany({ words, numberWords, language, rate, onRound, onCelebrate, scanning, scanMs }: GameProps) {
  const [level, setLevel] = useState(0);
  const [count, setCount] = useState(1);
  const [subject, setSubject] = useState<Word | null>(null);
  const [missed, setMissed] = useState<number[]>([]);
  const [found, setFound] = useState(false);
  const busy = useRef(false);
  const pool = distinctPictures(words);
  const poolRef = useRef(pool);
  poolRef.current = pool;
  const key = pool.map((w) => w.id).join(',');

  const deal = useCallback((atLevel: number) => {
    const top = COUNT_LEVELS[atLevel];
    const current = poolRef.current;
    setCount(1 + Math.floor(Math.random() * top));
    setSubject(current[Math.floor(Math.random() * current.length)] ?? null);
    setMissed([]);
    setFound(false);
    busy.current = false;
  }, []);

  useEffect(() => {
    setLevel(0);
    deal(0);
  }, [key, deal]);

  const top = COUNT_LEVELS[level];
  const choices = Array.from({ length: top }, (_, i) => i + 1);
  const { ref: board, cols, cell } = useCellGrid(Math.max(1, choices.length));

  const tap = (n: number) => {
    if (busy.current) return;
    if (n !== count) {
      setMissed((prev) => (prev.includes(n) ? prev : [...prev, n]));
      return;
    }
    busy.current = true;
    setFound(true);
    playPop();
    onRound('count', top);
    const spoken = numberWords[n - 1];
    void speakAsync(spoken ? wordText(spoken, language) : String(n), language, rate).then(() => {
      let next = level;
      if (missed.length === 0 && level < COUNT_LEVELS.length - 1 && Math.random() < 0.4) {
        next = level + 1;
        onCelebrate();
      }
      setLevel(next);
      window.setTimeout(() => deal(next), 500);
    });
  };
  const { scanIndex, takeLit } = useScan(scanning, choices.length, scanMs, (i) => tap(choices[i]));

  if (!subject) return <main className="play" />;

  return (
    <main className="play" onClickCapture={scanning ? takeLit : undefined}>
      <div className="play-count-set">
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className="play-count-item">
            <Picture word={subject} className="play-count" />
          </span>
        ))}
      </div>
      <div className="play-board" ref={board}>
        <div className="play-grid" style={{ '--cols': cols, '--cell': `${cell}px` } as React.CSSProperties}>
          {choices.map((n, i) => (
            <button
              key={n}
              className={`play-cell play-number ${missed.includes(n) ? 'play-cell-missed' : ''} ${
                found && n === count ? 'play-cell-found' : ''
              } ${i === scanIndex ? 'play-cell-lit' : ''}`}
              onClick={() => tap(n)}
              disabled={missed.includes(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------- what comes next */

/**
 * The child's own day, out of order, to be put back.
 *
 * Uses the schedule a caregiver already built, so the sequence being learned is
 * the one the child actually lives rather than a stock picture story.
 */
function WhatNext({ scheduleWords, language, rate, onRound, onCelebrate, scanning, scanMs }: GameProps) {
  const [placed, setPlaced] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const busy = useRef(false);
  const steps = distinctPictures(scheduleWords).slice(0, 6);
  const key = steps.map((w) => w.id).join(',');
  const [jumbled, setJumbled] = useState<Word[]>([]);

  useEffect(() => {
    setJumbled(shuffle(steps));
    setPlaced(0);
    setMissed([]);
    busy.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const { ref: board, cols, cell } = useCellGrid(Math.max(1, jumbled.length));

  const tap = (word: Word) => {
    if (busy.current) return;
    const wanted = steps[placed];
    if (!wanted || word.id !== wanted.id) {
      setMissed((prev) => (prev.includes(word.id) ? prev : [...prev, word.id]));
      return;
    }
    playPop();
    const next = placed + 1;
    setPlaced(next);
    setMissed([]);
    void speakAsync(wordText(word, language), language, rate);
    if (next >= steps.length) {
      busy.current = true;
      onRound('order', steps.length);
      onCelebrate();
      window.setTimeout(() => {
        setJumbled(shuffle(steps));
        setPlaced(0);
        busy.current = false;
      }, 1200);
    }
  };
  const { scanIndex, takeLit } = useScan(scanning, jumbled.length, scanMs, (i) => tap(jumbled[i]));

  if (steps.length < 2) {
    return (
      <main className="play">
        <p className="quiz-empty">
          Build this child&apos;s day in Settings → Day plan, and it becomes the
          game.
        </p>
      </main>
    );
  }

  return (
    <main className="play" onClickCapture={scanning ? takeLit : undefined}>
      <div className="play-order-strip">
        {steps.map((w, i) => (
          <span key={w.id} className={`play-order-slot ${i < placed ? 'play-order-done' : ''}`}>
            {i < placed ? <Picture word={w} className="play-order" /> : i + 1}
          </span>
        ))}
      </div>
      <div className="play-board" ref={board}>
        <div className="play-grid" style={{ '--cols': cols, '--cell': `${cell}px` } as React.CSSProperties}>
          {jumbled.map((word, i) => {
            const done = steps.indexOf(word) < placed;
            return (
              <button
                key={word.id}
                className={`play-cell ${done ? 'play-cell-found' : ''} ${
                  missed.includes(word.id) ? 'play-cell-missed' : ''
                } ${i === scanIndex ? 'play-cell-lit' : ''}`}
                onClick={() => tap(word)}
                disabled={done}
              >
                <Picture word={word} className="play-cell" />
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

/* --------------------------------------------------------------- first letter */

const LETTER_LEVELS = [2, 3, 4, 6];

/**
 * Which word starts with this letter?
 *
 * The letter comes from the child's *own* language alphabet, in that
 * language's teaching order, and the words come from the board in front of
 * them — so a Telugu child is asked about క with Telugu words, not about C
 * with translated ones. See `scriptLetters.ts` for why the unit differs by
 * script and why the question does not.
 */
function FirstLetter({ words, language, rate, ageMode, onRound, onCelebrate, scanning, scanMs }: GameProps) {
  const startLevel = ageMode === 1 ? 0 : ageMode === 2 ? 1 : 2;
  const [level, setLevel] = useState(startLevel);
  const [round, setRound] = useState<{ letter: string; answer: Word; options: Word[] } | null>(null);
  const [missed, setMissed] = useState<string[]>([]);
  const [found, setFound] = useState(false);
  const streak = useRef(0);
  const busy = useRef(false);

  const index = letterIndex(distinctPictures(words), language);
  const indexRef = useRef(index);
  indexRef.current = index;
  const key = index.map((i) => i.letter).join('');

  const deal = useCallback((atLevel: number) => {
    const groups = indexRef.current;
    if (groups.length < 2) return;
    const [target, ...rest] = shuffle(groups);
    const answer = shuffle(target.words)[0];
    // every distractor must start with a *different* letter, or there would be
    // two right answers and only one of them accepted
    const others = shuffle(rest.flatMap((g) => shuffle(g.words).slice(0, 1)))
      .slice(0, Math.min(LETTER_LEVELS[atLevel], groups.length) - 1);
    setRound({ letter: target.letter, answer, options: shuffle([answer, ...others]) });
    setMissed([]);
    setFound(false);
    busy.current = false;
  }, []);

  useEffect(() => {
    streak.current = 0;
    setLevel(startLevel);
    deal(startLevel);
  }, [key, startLevel, deal]);

  // say the letter itself when a round opens, so it is heard as well as seen
  useEffect(() => {
    if (round) void speakAsync(round.letter, language, rate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.letter]);

  const cells = round?.options ?? [];
  const { ref: board, cols, cell } = useCellGrid(Math.max(1, cells.length));

  const tap = (word: Word) => {
    if (busy.current || !round) return;
    if (word.id !== round.answer.id) {
      setMissed((prev) => (prev.includes(word.id) ? prev : [...prev, word.id]));
      streak.current = 0;
      return;
    }
    busy.current = true;
    setFound(true);
    playPop();
    onRound('letter', LETTER_LEVELS[level]);
    void speakAsync(wordText(word, language), language, rate).then(() => {
      streak.current = missed.length === 0 ? streak.current + 1 : 0;
      let next = level;
      if (streak.current >= 3 && level < LETTER_LEVELS.length - 1) {
        next = level + 1;
        streak.current = 0;
        onCelebrate();
      } else if (missed.length >= 3 && level > 0) {
        next = level - 1;
      }
      setLevel(next);
      window.setTimeout(() => deal(next), 500);
    });
  };
  const { scanIndex, takeLit } = useScan(scanning, cells.length, scanMs, (i) => tap(cells[i]));

  if (index.length < 2 || !round) {
    return (
      <main className="play">
        <p className="quiz-empty">
          Pick a category with a few more words and this game has letters to
          teach.
        </p>
      </main>
    );
  }

  return (
    <main className="play" onClickCapture={scanning ? takeLit : undefined}>
      <div className="play-letter">{round.letter}</div>
      <div className="play-board" ref={board}>
        <div className="play-grid" style={{ '--cols': cols, '--cell': `${cell}px` } as React.CSSProperties}>
          {cells.map((word, i) => (
            <button
              key={word.id}
              className={`play-cell ${missed.includes(word.id) ? 'play-cell-missed' : ''} ${
                found && word.id === round.answer.id ? 'play-cell-found' : ''
              } ${i === scanIndex ? 'play-cell-lit' : ''}`}
              onClick={() => tap(word)}
              disabled={missed.includes(word.id)}
            >
              <Picture word={word} className="play-cell" />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export function PlayGames({ game, ...rest }: PlayGamesProps) {
  switch (game) {
    case 'find':
      return <FindIt {...rest} />;
    case 'pairs':
      return <Pairs {...rest} />;
    case 'touch':
      return <TouchAnything {...rest} />;
    case 'odd':
      return <OddOneOut {...rest} />;
    case 'count':
      return <HowMany {...rest} />;
    case 'letter':
      return <FirstLetter {...rest} />;
    default:
      return <WhatNext {...rest} />;
  }
}
