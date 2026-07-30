import { wordLabel } from '../i18n';
import type { HistoryEntry, Language, Word } from '../types';

interface HistoryModalProps {
  history: HistoryEntry[];
  wordIndex: Map<string, Word>;
  language: Language;
  onPick: (words: Word[]) => void;
  onClose: () => void;
}

function timeAgo(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/** Recent spoken sentences — tap one to load it back into the strip */
export function HistoryModal({ history, wordIndex, language, onPick, onClose }: HistoryModalProps) {
  const rows = history
    .map((entry) => ({
      entry,
      words: entry.wordIds
        .map((id) => wordIndex.get(id))
        .filter((w): w is Word => Boolean(w)),
    }))
    .filter((row) => row.words.length > 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>🕘 Recent sentences</h2>
        {rows.length === 0 ? (
          <p className="progress-line">Nothing spoken yet.</p>
        ) : (
          <div className="history-list">
            {rows.map(({ entry, words }, i) => (
              <button key={`${entry.ts}-${i}`} className="history-row" onClick={() => onPick(words)}>
                <span className="history-emojis" aria-hidden="true">
                  {words.map((w, j) =>
                    w.image ? (
                      <img key={j} src={w.image} alt="" className="history-img" />
                    ) : (
                      <span key={j}>{w.emoji}</span>
                    ),
                  )}
                </span>
                <span className="history-text">
                  {words.map((w) => wordLabel(w, language)).join(' ')}
                </span>
                <span className="history-time">{timeAgo(entry.ts)}</span>
              </button>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
