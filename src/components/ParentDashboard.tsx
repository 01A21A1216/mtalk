import { useMemo, useState } from 'react';
import { wordLabel } from '../i18n';
import { MASTERY_STREAK } from '../hooks/useMastery';
import {
  categoryCoverage,
  dailySeries,
  quizSummary,
  sentenceSummary,
  summarise,
  topWordsInRange,
  type UsageMap,
} from '../services/analytics';
import { coachingTips } from '../services/coaching';
import { loadChildData } from '../services/childData';
import type { Category, HistoryEntry, Language, Profile, Settings, Word, WordStat } from '../types';

interface ParentDashboardProps {
  /** Children this grown-up looks after — one tab each when there is more than one */
  kids: Profile[];
  activeChildId: string;
  /** Live data for the child whose board is open; siblings are read from storage */
  usage: UsageMap;
  stats: Record<string, WordStat>;
  history: HistoryEntry[];
  categories: Category[];
  wordIndex: Map<string, Word>;
  settings: Settings;
  language: Language;
}

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 28, label: '28 days' },
];

/** Big number + caption. The caption carries the meaning, not the number. */
function Stat({
  value,
  label,
  hint,
  tone = 'plain',
}: {
  value: string | number;
  label: string;
  hint?: string;
  tone?: 'plain' | 'warm' | 'cool' | 'green';
}) {
  return (
    <div className={`dash-stat dash-stat-${tone}`}>
      <span className="dash-stat-value">{value}</span>
      <span className="dash-stat-label">{label}</span>
      {hint && <span className="dash-stat-hint">{hint}</span>}
    </div>
  );
}

/**
 * What the child has been saying, for the grown-up. Everything here is read
 * from what already happens as the child taps — nothing extra is recorded,
 * and none of it leaves the device.
 */
export function ParentDashboard({
  kids,
  activeChildId,
  usage,
  stats,
  history,
  categories,
  wordIndex,
  settings,
  language,
}: ParentDashboardProps) {
  const [days, setDays] = useState(7);
  const [childId, setChildId] = useState(activeChildId);

  const child = kids.find((c) => c.id === childId) ?? kids[0];
  const childName = child?.name ?? '';

  // The open child's numbers come from live state; a sibling's are read from
  // storage, which their own hooks keep up to date.
  const data = useMemo(
    () =>
      childId === activeChildId
        ? { usage, stats, history }
        : loadChildData(childId),
    [childId, activeChildId, usage, stats, history],
  );

  const series = useMemo(() => dailySeries(data.usage, days), [data.usage, days]);
  const summary = useMemo(() => summarise(data.usage, days), [data.usage, days]);
  const coverage = useMemo(
    () => categoryCoverage(data.usage, categories, settings.ageMode),
    [data.usage, categories, settings.ageMode],
  );
  const quiz = useMemo(() => quizSummary(data.stats, MASTERY_STREAK), [data.stats]);
  const sentences = useMemo(() => sentenceSummary(data.history), [data.history]);
  const top = useMemo(() => topWordsInRange(data.usage, days, 8), [data.usage, days]);
  const tips = useMemo(
    () =>
      coachingTips(data.usage, data.history, categories, wordIndex, days, childName),
    [data.usage, data.history, categories, wordIndex, days, childName],
  );

  const peak = Math.max(1, ...series.map((d) => d.taps));
  const label = (id: string) => {
    const word = wordIndex.get(id);
    if (word) return `${word.emoji ?? '·'} ${wordLabel(word, language)}`;
    // A sibling's own custom tiles are not in this child's index — show a
    // readable name rather than a raw id
    return id.replace(/^(custom|tile|story|letter)-/, '').replace(/-/g, ' ');
  };

  const quiet = summary.taps === 0;

  return (
    <div className="dash">
      {kids.length > 1 && (
        <div className="dash-kids" role="tablist" aria-label="Choose a child">
          {kids.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={c.id === childId}
              className={`dash-kid ${c.id === childId ? 'dash-kid-active' : ''}`}
              onClick={() => setChildId(c.id)}
            >
              <span aria-hidden="true">{c.emoji}</span> {c.name}
            </button>
          ))}
        </div>
      )}

      <header className="dash-head">
        <div>
          <h3 className="dash-title">📊 {childName}'s talking</h3>
          <p className="ft-hint">
            Everything below comes from ordinary use of the board, and stays on
            this tablet.
          </p>
        </div>
        <div className="segmented dash-range">
          {RANGES.map((r) => (
            <button
              key={r.days}
              className={days === r.days ? 'seg-active' : ''}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {quiet ? (
        <p className="dash-empty">
          Nothing recorded in the last {days} days yet. As soon as {childName}
          starts tapping tiles, their words show up here — no setup needed.
        </p>
      ) : (
        <>
          <div className="dash-stats">
            <Stat value={summary.taps} label="words spoken" tone="warm" />
            <Stat
              value={summary.uniqueWords}
              label="different words"
              hint="breadth matters more than volume"
              tone="cool"
            />
            <Stat value={summary.newWords} label="new words" hint="first time ever used" tone="green" />
            <Stat
              value={`${summary.activeDays}/${days}`}
              label="days talking"
              hint={summary.streak > 1 ? `${summary.streak} in a row` : undefined}
            />
          </div>

          <section className="dash-block">
            <h4>Every day</h4>
            <div className="dash-chart" role="img" aria-label={`Daily activity for the last ${days} days`}>
              {series.map((d) => (
                <div key={d.day} className="dash-bar-wrap" title={`${d.label}: ${d.taps} words, ${d.words} different`}>
                  <div
                    className={`dash-bar ${d.taps === 0 ? 'dash-bar-empty' : ''}`}
                    style={{ height: `${Math.round((d.taps / peak) * 100)}%` }}
                  />
                  <span className="dash-bar-label">{d.weekday}</span>
                </div>
              ))}
            </div>
            {summary.busiest && (
              <p className="ft-hint">
                Busiest day: {summary.busiest.label} — {summary.busiest.taps} words,{' '}
                {summary.busiest.words} of them different.
              </p>
            )}
          </section>

          <section className="dash-block">
            <h4>Which categories get used</h4>
            <p className="ft-hint">
              How much of each category {childName} has reached for. Thin bars
              are a good prompt for what to model next — not a gap to worry about.
            </p>
            <div className="dash-coverage">
              {coverage.slice(0, 10).map((c) => (
                <div key={c.id} className="dash-cov-row">
                  <span className="dash-cov-name">
                    {c.emoji} {c.name}
                  </span>
                  <span className="dash-cov-track">
                    <span
                      className="dash-cov-fill"
                      style={{
                        width: `${Math.round((c.used / c.available) * 100)}%`,
                        background: c.colorDark,
                      }}
                    />
                  </span>
                  <span className="dash-cov-count">
                    {c.used}/{c.available}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {tips.length > 0 && (
            <section className="dash-block">
              <h4>What to try next</h4>
              <div className="dash-tips">
                {tips.map((tip) => (
                  <div key={tip.id} className="dash-tip">
                    <span className="dash-tip-emoji" aria-hidden="true">{tip.emoji}</span>
                    <span>
                      {tip.text}
                      <small className="dash-tip-why">{tip.because}</small>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="dash-block">
            <h4>Most-used words</h4>
            <div className="dash-chips">
              {top.map((w) => (
                <span key={w.id} className="dash-chip">
                  {label(w.id)}
                  <b>{w.taps}</b>
                </span>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="dash-block">
        <h4>Sentences</h4>
        {sentences.count === 0 ? (
          <p className="ft-hint">
            No sentences yet. Tapping two or more tiles before 🔊 Speak builds one.
          </p>
        ) : (
          <div className="dash-stats">
            <Stat value={sentences.count} label="recent sentences" hint="last 20 kept" />
            <Stat value={sentences.longest} label="longest" hint="words in one go" />
            <Stat value={sentences.average.toFixed(1)} label="average length" />
          </div>
        )}
      </section>

      <section className="dash-block">
        <h4>Quiz</h4>
        {quiz.attempts === 0 ? (
          <p className="ft-hint">
            No quiz answers yet. The 🎯 Quiz tab turns the same vocabulary into
            a listen-and-pick game.
          </p>
        ) : (
          <>
            <div className="dash-stats">
              <Stat value={quiz.mastered} label="words mastered" hint={`${MASTERY_STREAK} right in a row`} tone="green" />
              <Stat value={quiz.practising} label="still practising" />
              <Stat value={`${Math.round(quiz.accuracy * 100)}%`} label="right first time" />
            </div>
            {quiz.tricky.length > 0 && (
              <>
                <p className="ft-hint">Worth practising together:</p>
                <div className="dash-chips">
                  {quiz.tricky.map((t) => (
                    <span key={t.id} className="dash-chip">
                      {label(t.id)}
                      <b>{Math.round(t.accuracy * 100)}%</b>
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
