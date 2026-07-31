import { wordLabel } from '../i18n';
import type { Language, ScheduleStep, Word } from '../types';

interface DayScheduleProps {
  steps: ScheduleStep[];
  doneIds: string[];
  currentIndex: number;
  wordIndex: Map<string, Word>;
  language: Language;
  onToggle: (id: string) => void;
  onSpeak: (word: Word) => void;
}

/**
 * Full-day routine strip: wake → school → play → dinner → sleep. The current
 * step is highlighted, finished steps get a tick, and everything clears
 * automatically overnight.
 */
export function DaySchedule({ steps, doneIds, currentIndex, wordIndex, language, onToggle, onSpeak }: DayScheduleProps) {
  const rows = steps
    .map((step) => ({ step, word: wordIndex.get(step.wordId) }))
    .filter((r): r is { step: ScheduleStep; word: Word } => Boolean(r.word));

  if (rows.length === 0) return null;

  return (
    <div className="day-schedule" aria-label="Today's plan">
      {rows.map(({ step, word }, i) => {
        const done = doneIds.includes(step.id);
        const current = i === currentIndex;
        return (
          <div
            key={step.id}
            className={`ds-step ${done ? 'ds-done' : ''} ${current ? 'ds-current' : ''}`}
          >
            <button
              className="ds-face"
              onClick={() => onSpeak(word)}
              aria-label={wordLabel(word, language)}
            >
              {step.time && <span className="ds-time">{step.time}</span>}
              {word.image ? (
                <img src={word.image} alt="" className="ds-img" />
              ) : (
                <span className="ds-emoji" aria-hidden="true">{word.emoji}</span>
              )}
              <span className="ds-name">{wordLabel(word, language)}</span>
            </button>
            <button
              className={`ds-tick ${done ? 'ds-tick-on' : ''}`}
              onClick={() => onToggle(step.id)}
              aria-label={done ? 'Mark not done' : 'Mark done'}
            >
              {done ? '✅' : '⬜'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
