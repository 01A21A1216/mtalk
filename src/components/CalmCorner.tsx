import { useEffect, useRef, useState } from 'react';
import { UI } from '../i18n';
import { speak } from '../services/speech';
import type { Language } from '../types';

interface CalmCornerProps {
  language: Language;
  rate: number;
  onClose: () => void;
}

type Phase = 'in' | 'hold' | 'out';

/** 4-4-6 breathing: slow, even, and long on the out-breath to settle the body */
const PHASES: { phase: Phase; seconds: number }[] = [
  { phase: 'in', seconds: 4 },
  { phase: 'hold', seconds: 4 },
  { phase: 'out', seconds: 6 },
];

/**
 * Calm corner: a big breathing bubble that grows and shrinks with spoken
 * prompts, for meltdowns and overwhelm. No scores, no timers, no pressure.
 */
export function CalmCorner({ language, rate, onClose }: CalmCornerProps) {
  const [index, setIndex] = useState(0);
  const [rounds, setRounds] = useState(0);
  const spokenRef = useRef(-1);
  const step = PHASES[index % PHASES.length];

  // advance through in → hold → out forever until the child closes it
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIndex((i) => {
        const next = i + 1;
        if (next % PHASES.length === 0) setRounds((r) => r + 1);
        return next;
      });
    }, step.seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [index, step.seconds]);

  // speak each phase once
  useEffect(() => {
    if (spokenRef.current === index) return;
    spokenRef.current = index;
    const ui = UI[language];
    const text =
      step.phase === 'in' ? ui.breatheIn : step.phase === 'hold' ? ui.breatheHold : ui.breatheOut;
    speak(text, language, Math.min(0.8, rate));
  }, [index, step.phase, language, rate]);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  const ui = UI[language];
  const label =
    step.phase === 'in' ? ui.breatheIn : step.phase === 'hold' ? ui.breatheHold : ui.breatheOut;

  return (
    <div className="calm-screen" onClick={onClose}>
      <div className={`calm-bubble calm-${step.phase}`} style={{ animationDuration: `${step.seconds}s` }}>
        <span className="calm-face" aria-hidden="true">
          {step.phase === 'out' ? '😌' : '🫧'}
        </span>
      </div>
      <p className="calm-label">{label}</p>
      <p className="calm-rounds" aria-hidden="true">
        {'⭐'.repeat(Math.min(rounds, 5))}
      </p>
      <button className="btn-secondary calm-close" onClick={onClose}>
        Done
      </button>
    </div>
  );
}
