import { memo, useState } from 'react';
import { wordLabel, wordSecondary } from '../i18n';
import type { Language, Word } from '../types';

interface TileProps {
  word: Word;
  language: Language;
  showBoth: boolean;
  color: string;
  colorDark: string;
  /** Highlighted by scanning access mode */
  scanned?: boolean;
  onTap: (word: Word) => void;
}

/** Memoized: the grid can hold 100 tiles and must not re-render per tap */
export const Tile = memo(function Tile({ word, language, showBoth, color, colorDark, scanned, onTap }: TileProps) {
  const [bouncing, setBouncing] = useState(false);

  const primary = wordLabel(word, language);
  const secondary = wordSecondary(word, language);

  const handleTap = () => {
    setBouncing(true);
    onTap(word);
  };

  return (
    <button
      className={`tile ${bouncing ? 'tile-bounce' : ''} ${scanned ? 'tile-scanned' : ''}`}
      style={{ background: color, borderColor: colorDark }}
      onClick={handleTap}
      onAnimationEnd={() => setBouncing(false)}
      aria-label={primary}
    >
      {word.image ? (
        <img src={word.image} alt="" className="tile-image" />
      ) : (
        <span className="tile-emoji" aria-hidden="true">
          {word.emoji}
        </span>
      )}
      <span className="tile-label" style={{ color: colorDark }}>
        {primary}
      </span>
      {showBoth && secondary && secondary !== primary && (
        <span className="tile-sublabel">{secondary}</span>
      )}
    </button>
  );
});
