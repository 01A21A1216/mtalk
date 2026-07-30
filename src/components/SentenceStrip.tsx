import { UI, wordLabel } from '../i18n';
import type { Language, Word } from '../types';

interface SentenceStripProps {
  words: Word[];
  language: Language;
  speaking: boolean;
  hasHistory: boolean;
  onPlay: () => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onHistory: () => void;
}

export function SentenceStrip({ words, language, speaking, hasHistory, onPlay, onRemove, onClear, onHistory }: SentenceStripProps) {
  return (
    <div className="sentence-strip">
      <div className="sentence-words">
        {words.length === 0 ? (
          <span className="sentence-hint">{UI[language].sentenceHint}</span>
        ) : (
          words.map((word, index) => (
            <button
              key={`${word.id}-${index}`}
              className="sentence-chip"
              onClick={() => onRemove(index)}
              aria-label={`Remove ${wordLabel(word, language)}`}
            >
              {word.image ? (
                <img src={word.image} alt="" className="sentence-chip-img" />
              ) : (
                <span className="sentence-chip-emoji" aria-hidden="true">
                  {word.emoji}
                </span>
              )}
              <span className="sentence-chip-label">{wordLabel(word, language)}</span>
            </button>
          ))
        )}
      </div>
      <div className="sentence-actions">
        <button
          className={`btn-speak ${speaking ? 'btn-speak-active' : ''}`}
          onClick={onPlay}
          disabled={words.length === 0}
          aria-label="Speak"
        >
          🔊
        </button>
        <button
          className="btn-clear"
          onClick={onClear}
          disabled={words.length === 0}
          aria-label="Clear"
        >
          🧹
        </button>
        <button
          className="btn-history"
          onClick={onHistory}
          disabled={!hasHistory}
          aria-label="Recent sentences"
        >
          🕘
        </button>
      </div>
    </div>
  );
}
