import { QUICK_WORDS } from '../data/vocabulary';
import { wordLabel } from '../i18n';
import type { Language, Word } from '../types';

interface QuickBarProps {
  language: Language;
  onTap: (word: Word) => void;
}

/** Always-visible strip of the most urgent core words */
export function QuickBar({ language, onTap }: QuickBarProps) {
  return (
    <div className="quick-bar" aria-label="Quick words">
      {QUICK_WORDS.map((word) => (
        <button
          key={word.id}
          className="quick-tile"
          onClick={() => onTap(word)}
          aria-label={wordLabel(word, language)}
        >
          <span className="quick-emoji" aria-hidden="true">
            {word.emoji}
          </span>
          <span className="quick-label">{wordLabel(word, language)}</span>
        </button>
      ))}
    </div>
  );
}
