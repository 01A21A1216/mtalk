import { useEffect, useRef, useState } from 'react';
import { UI } from '../i18n';
import { speak } from '../services/speech';
import type { Language } from '../types';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  /** Seconds of today's budget left when the player opened */
  remainingSeconds: number;
  /** Full daily budget, for the progress bar */
  limitSeconds: number;
  language: Language;
  /** Called once per second of watching so the budget persists */
  onTick: () => void;
  onClose: () => void;
}

function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Timed YouTube reward player. A visual countdown drains at the top so the
 * child can see time passing; at zero the video stops and a friendly lock
 * screen takes over until a parent resets the budget (or tomorrow comes).
 */
export function VideoPlayer({ videoId, title, remainingSeconds, limitSeconds, language, onTick, onClose }: VideoPlayerProps) {
  const [remaining, setRemaining] = useState(remainingSeconds);
  const locked = remaining <= 0;
  const warnedRef = useRef(false);

  useEffect(() => {
    if (locked) {
      speak(UI[language].videoOver, language);
      return;
    }
    const timer = window.setInterval(() => {
      onTick();
      setRemaining((r) => r - 1);
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  useEffect(() => {
    if (!locked && remaining === 60 && !warnedRef.current) {
      warnedRef.current = true;
      speak(UI[language].videoWarn, language);
    }
  }, [remaining, locked, language]);

  const pct = Math.max(0, Math.min(100, (remaining / limitSeconds) * 100));

  return (
    <div className="modal-backdrop video-backdrop">
      <div className="video-shell" onClick={(e) => e.stopPropagation()}>
        <div className="video-topbar">
          <span className="video-title">🎬 {title}</span>
          <div
            className="video-timer"
            role="timer"
            aria-label={`${clock(Math.max(0, remaining))} of video time left`}
          >
            <div
              className={`video-timer-fill ${remaining <= 60 ? 'video-timer-low' : ''}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`video-clock ${remaining <= 60 ? 'video-clock-low' : ''}`}>
            ⏳ {clock(Math.max(0, remaining))}
          </span>
          <button className="btn-clear video-close" onClick={onClose} aria-label="Close video">
            ✖
          </button>
        </div>

        {locked ? (
          <div className="video-locked">
            <span className="video-locked-emoji" aria-hidden="true">🌙📺</span>
            <p className="video-locked-text">{UI[language].videoOver}</p>
            <p className="video-locked-sub">
              Grown-ups can reset video time in ⚙️ Settings.
            </p>
            <button className="btn-primary" onClick={onClose}>
              OK 👍
            </button>
          </div>
        ) : (
          <div className="video-stage">
            <iframe
              className="video-frame"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&playsinline=1&modestbranding=1`}
              title={title}
              allow="autoplay; encrypted-media"
            />
            {/* transparent shield: absorbs every tap so the child cannot
                pause, seek, or click through to YouTube */}
            <div className="video-shield" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
