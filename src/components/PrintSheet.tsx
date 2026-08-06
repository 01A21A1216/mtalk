import { MASTERY_STREAK } from '../hooks/useMastery';
import { CORE_WORD_IDS } from '../data/coreWords';
import { wordLabel, wordSecondary } from '../i18n';
import {
  categoryCoverage,
  quizSummary,
  summarise,
  topWordsInRange,
  type UsageMap,
} from '../services/analytics';
import type { Category, Language, Settings, Word, WordStat } from '../types';

interface PrintSheetProps {
  kind: 'book' | 'summary';
  childName: string;
  language: Language;
  settings: Settings;
  wordIndex: Map<string, Word>;
  customTiles: { id: string; en: string; image: string }[];
  usage: UsageMap;
  stats: Record<string, WordStat>;
  categories: Category[];
}

const PER_PAGE = 6;

/**
 * Paper versions of the board.
 *
 * Two things a tablet cannot do: work when it is flat or forgotten, and be
 * handed to a teacher. A paper book covers the first — six big tiles a page,
 * cut out or kept whole. A one-page summary covers the second, for the
 * fortnightly therapy visit where nobody has time to read a dashboard.
 *
 * The summary carries the child's first name and nothing else identifying: it
 * is going to leave the house.
 */
export function PrintSheet({
  kind,
  childName,
  language,
  settings,
  wordIndex,
  customTiles,
  usage,
  stats,
  categories,
}: PrintSheetProps) {
  const today = new Date().toLocaleDateString();

  if (kind === 'book') {
    const core = CORE_WORD_IDS.map((id) => wordIndex.get(id)).filter(
      (w): w is Word => Boolean(w),
    );
    const mine: Word[] = customTiles.map((t) => ({
      id: t.id,
      emoji: '⭐',
      en: t.en,
      hi: t.en,
      image: t.image,
      level: 1,
    }));
    const favourites = topWordsInRange(usage, 28, 12)
      .map((w) => wordIndex.get(w.id))
      .filter((w): w is Word => Boolean(w))
      .filter((w) => !CORE_WORD_IDS.includes(w.id));

    const sections = [
      { title: 'Core words', words: core },
      { title: 'My words', words: mine },
      { title: 'Words I use most', words: favourites },
    ].filter((s) => s.words.length > 0);

    const pages: { title: string; words: Word[] }[] = [];
    for (const section of sections) {
      for (let i = 0; i < section.words.length; i += PER_PAGE) {
        pages.push({ title: section.title, words: section.words.slice(i, i + PER_PAGE) });
      }
    }

    return (
      <div className="print-sheet">
        {pages.map((page, i) => (
          <section className="print-page" key={i}>
            <header className="print-head">
              <span>
                {childName}'s book — {page.title}
              </span>
              <span>
                page {i + 1} of {pages.length}
              </span>
            </header>
            <div className="print-grid">
              {page.words.map((word) => (
                <div className="print-tile" key={word.id}>
                  {word.image ? (
                    <img src={word.image} alt="" className="print-pic" />
                  ) : (
                    <span className="print-emoji">{word.emoji}</span>
                  )}
                  <span className="print-label">{wordLabel(word, language)}</span>
                  {settings.motherTongue && (
                    <span className="print-second">
                      {wordSecondary(word, language, settings.motherTongue)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <footer className="print-foot">
              MTalk · point to talk · printed {today}
            </footer>
          </section>
        ))}
      </div>
    );
  }

  // ------------------------------------------------------------- summary
  const days = 28;
  const totals = summarise(usage, days);
  const quiz = quizSummary(stats, MASTERY_STREAK);
  const coverage = categoryCoverage(usage, categories, settings.ageMode).slice(0, 8);
  const top = topWordsInRange(usage, days, 10)
    .map((w) => ({ word: wordIndex.get(w.id), taps: w.taps }))
    .filter((w) => w.word);

  return (
    <div className="print-sheet">
      <section className="print-page print-summary">
        <header className="print-head">
          <span>{childName} — how talking is going</span>
          <span>last {days} days · {today}</span>
        </header>

        <div className="print-stats">
          <div>
            <b>{totals.taps}</b> words spoken
          </div>
          <div>
            <b>{totals.uniqueWords}</b> different words
          </div>
          <div>
            <b>{totals.newWords}</b> new words
          </div>
          <div>
            <b>
              {totals.activeDays}/{days}
            </b>{' '}
            days used
          </div>
        </div>

        <h3 className="print-h">Words used most</h3>
        <p className="print-words">
          {top.length
            ? top.map((t) => `${wordLabel(t.word!, language)} (${t.taps})`).join(' · ')
            : 'No words recorded yet.'}
        </p>

        <h3 className="print-h">Which categories are being reached for</h3>
        <table className="print-table">
          <tbody>
            {coverage.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>
                  {c.used} of {c.available} words
                </td>
                <td>{c.taps} taps</td>
              </tr>
            ))}
          </tbody>
        </table>

        {quiz.attempts > 0 && (
          <>
            <h3 className="print-h">Picture quiz</h3>
            <p className="print-words">
              {quiz.mastered} mastered · {quiz.practising} still practising ·{' '}
              {Math.round(quiz.accuracy * 100)}% right first time
              {quiz.tricky.length > 0 && (
                <>
                  <br />
                  Worth practising:{' '}
                  {quiz.tricky
                    .map((t) => wordLabel(wordIndex.get(t.id) ?? ({ en: t.id } as Word), language))
                    .join(' · ')}
                </>
              )}
            </p>
          </>
        )}

        <p className="print-note">
          From MTalk on the family's tablet. Counts come from ordinary use of
          the board — no test was set, and a quiet week usually means a busy
          one at home rather than a step backwards.
        </p>
        <footer className="print-foot">MTalk · printed {today}</footer>
      </section>
    </div>
  );
}
