import { useEffect, useRef, useState } from 'react';
import type { Story } from '../data/stories';
import { playAudioAsync, playPop, speakAsync } from '../services/speech';
import type { Language } from '../types';

interface StoryPlayerProps {
  story: Story;
  language: Language;
  rate: number;
  onClose: () => void;
}

/**
 * Picture-book reader: each line is a "page" with a big emoji scene, spoken
 * aloud with the text below. Auto-plays; arrows let kids browse pages.
 */
export function StoryPlayer({ story, language, rate, onClose }: StoryPlayerProps) {
  // Hindi text when available and selected; everything else reads English
  const useHindi = language === 'hi' && !!story.lines.hi;
  const lines = useHindi ? story.lines.hi! : story.lines.en;
  const speechLang: Language = useHindi ? 'hi' : 'en';
  const title = (language === 'hi' && story.title.hi) || story.title.en;

  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const cancelledRef = useRef(false);

  const stop = () => {
    cancelledRef.current = true;
    window.speechSynthesis?.cancel();
    setPlaying(false);
  };

  const sayPage = async (i: number) => {
    const recorded = story.audios?.[i];
    if (recorded) await playAudioAsync(recorded);
    else await speakAsync(lines[i], speechLang, rate);
  };

  const playFrom = async (start: number) => {
    cancelledRef.current = false;
    setPlaying(true);
    for (let i = start; i < lines.length; i++) {
      if (cancelledRef.current) return;
      setPage(i);
      await sayPage(i);
    }
    if (!cancelledRef.current) setPlaying(false);
  };

  const goTo = (next: number) => {
    stop();
    const clamped = Math.max(0, Math.min(lines.length - 1, next));
    playPop();
    setPage(clamped);
    // read just this page so browsing is still narrated
    cancelledRef.current = false;
    void sayPage(clamped);
  };

  /**
   * Always open on the first page and read from there — including when a
   * different story is opened into the same player. Without keying on the
   * story, the previous book's page number (and its line of text) would still
   * be on screen when the next one opened.
   */
  useEffect(() => {
    setPage(0);
    void playFrom(0);
    return () => {
      cancelledRef.current = true;
      window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.id]);

  const finished = !playing && page === lines.length - 1;

  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        stop();
        onClose();
      }}
    >
      <div className="modal story-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="story-title">
          <span aria-hidden="true">{story.emoji}</span> {title}
        </h2>

        {story.images?.[page] ? (
          <div className="story-scene story-scene-photo" key={`img-${page}`} aria-hidden="true">
            <img src={story.images[page]!} alt="" className="story-scene-img" />
          </div>
        ) : (
          <div className="story-scene" key={page} aria-hidden="true">
            {story.art[page] ?? story.emoji}
          </div>
        )}

        <p className="story-current-line">{lines[page]}</p>

        <div className="story-dots" aria-label={`Page ${page + 1} of ${lines.length}`}>
          {lines.map((_, i) => (
            <span key={i} className={`story-dot ${i === page ? 'story-dot-active' : ''}`} />
          ))}
        </div>

        <div className="modal-actions story-actions">
          <button
            className="btn-history story-nav"
            onClick={() => goTo(page - 1)}
            disabled={page === 0}
            aria-label="Previous page"
          >
            ⏮
          </button>
          <button
            className="btn-speak story-play"
            // At the end, ▶️ means "read it again" from page one — replaying
            // only the last line is never what a child is asking for
            onClick={() => (playing ? stop() : void playFrom(finished ? 0 : page))}
            aria-label={playing ? 'Stop' : finished ? 'Read again' : 'Play'}
          >
            {playing ? '⏹' : finished ? '🔁' : '▶️'}
          </button>
          <button
            className="btn-history story-nav"
            onClick={() => goTo(page + 1)}
            disabled={page === lines.length - 1}
            aria-label="Next page"
          >
            ⏭
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              stop();
              onClose();
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
