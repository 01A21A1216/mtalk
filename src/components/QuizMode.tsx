import { useCallback, useEffect, useRef, useState } from 'react';
import { isMastered } from '../hooks/useMastery';
import { UI } from '../i18n';
import { playPop, speakAsync, wordText } from '../services/speech';
import type { AgeMode, Language, Word, WordStat } from '../types';

interface QuizModeProps {
  words: Word[];
  language: Language;
  rate: number;
  ageMode: AgeMode;
  stats: Record<string, WordStat>;
  onAnswer: (wordId: string, firstTry: boolean) => void;
  onCelebrate: () => void;
}

interface Question {
  target: Word;
  options: Word[];
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function promptText(target: Word, language: Language): string {
  return UI[language].quizPrompt(wordText(target, language));
}

export function QuizMode({ words, language, rate, ageMode, stats, onAnswer, onCelebrate }: QuizModeProps) {
  const optionCount = ageMode === 1 ? 2 : 4;
  const [question, setQuestion] = useState<Question | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const busyRef = useRef(false);

  const nextQuestion = useCallback(() => {
    if (words.length < 2) {
      setQuestion(null);
      return;
    }
    // prefer words not yet mastered, but revisit mastered ones ~20% of the
    // time so they stay fresh (light spaced repetition)
    const unmastered = words.filter((w) => !isMastered(stats[w.id]));
    const pool =
      unmastered.length === 0 || Math.random() < 0.2 ? words : unmastered;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const distractors = shuffle(words.filter((w) => w.id !== target.id)).slice(
      0,
      Math.min(optionCount, words.length) - 1,
    );
    setWrongIds([]);
    setCorrectId(null);
    busyRef.current = false;
    setQuestion({ target, options: shuffle([target, ...distractors]) });
  }, [words, optionCount, stats]);

  // new question whenever the word set changes (category/age/language switch)
  useEffect(() => {
    setScore(0);
    nextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, optionCount]);

  // speak the prompt each time a question appears
  useEffect(() => {
    if (question) void speakAsync(promptText(question.target, language), language, rate);
  }, [question, language, rate]);

  if (words.length < 2) {
    return (
      <main className="quiz">
        <p className="quiz-empty">{UI[language].notEnoughWords}</p>
      </main>
    );
  }

  if (!question) return <main className="quiz" />;

  const handleTap = (word: Word) => {
    if (busyRef.current) return;
    if (word.id === question.target.id) {
      busyRef.current = true;
      const firstTry = wrongIds.length === 0;
      onAnswer(question.target.id, firstTry);
      setCorrectId(word.id);
      playPop();
      const newScore = score + 1;
      setScore(newScore);
      void speakAsync(UI[language].praise, language, rate).then(() => {
        if (newScore % 5 === 0) onCelebrate();
        window.setTimeout(nextQuestion, 600);
      });
    } else {
      setWrongIds((prev) => [...prev, word.id]);
      void speakAsync(UI[language].tryAgain, language, rate).then(
        () => void speakAsync(promptText(question.target, language), language, rate),
      );
    }
  };

  return (
    <main className="quiz">
      <div className="quiz-header">
        <button
          className="quiz-prompt"
          onClick={() => void speakAsync(promptText(question.target, language), language, rate)}
        >
          🔊 {promptText(question.target, language)}
        </button>
        <div className="quiz-score" aria-label="Score">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < score % 5 || (score > 0 && score % 5 === 0) ? '' : 'star-dim'}>
              ⭐
            </span>
          ))}
          <span className="quiz-score-num">{score}</span>
        </div>
      </div>

      <div className={`quiz-options quiz-options-${question.options.length}`}>
        {question.options.map((word) => {
          const wrong = wrongIds.includes(word.id);
          const right = correctId === word.id;
          return (
            <button
              key={word.id}
              className={`quiz-option ${wrong ? 'quiz-option-wrong' : ''} ${right ? 'quiz-option-right' : ''}`}
              onClick={() => handleTap(word)}
              disabled={wrong}
            >
              {word.image ? (
                <img src={word.image} alt="" className="quiz-option-img" />
              ) : (
                <span className="quiz-option-emoji" aria-hidden="true">
                  {word.emoji}
                </span>
              )}
              {(wrong || right) && (
                <span className="quiz-option-label">{wordText(word, language)}</span>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}
