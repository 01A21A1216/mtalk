import { useEffect, useRef, useState } from 'react';
import { CORE_WORD_IDS } from '../data/coreWords';
import { wordLabel } from '../i18n';
import { deleteVoiceClip, getVoiceClips, putVoiceClip } from '../services/db';
import { playAudioAsync } from '../services/speech';
import { setRecordedVoice } from '../services/voicePack';
import type { Language, Word } from '../types';

interface VoicePackProps {
  profileId: string;
  childName: string;
  language: Language;
  wordIndex: Map<string, Word>;
}

const MAX_SECONDS = 3;

/**
 * Record the core words in your own voice.
 *
 * Deliberately one word at a time with a big button: a parent doing forty of
 * these is the difference between finishing and giving up. Nothing is
 * mandatory — the words with no recording simply fall back to the synthetic
 * voice, so a half-finished pack is still useful.
 */
export function VoicePack({ profileId, childName, language, wordIndex }: VoicePackProps) {
  const words = CORE_WORD_IDS.map((id) => wordIndex.get(id)).filter(
    (w): w is Word => Boolean(w),
  );

  const [done, setDone] = useState<Set<string>>(new Set());
  const [at, setAt] = useState(0);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const word = words[at];

  useEffect(() => {
    let live = true;
    void getVoiceClips(profileId).then((clips) => {
      if (live) setDone(new Set(clips.map((c) => c.wordId)));
    });
    return () => {
      live = false;
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, [profileId]);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        window.isSecureContext
          ? 'This browser cannot record audio.'
          : 'Recording needs a secure connection — use the installed app or the https address.',
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => chunks.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setBusy(true);
        const blob = new Blob(chunks.current, { type: rec.mimeType });
        const reader = new FileReader();
        reader.onload = async () => {
          const audio = reader.result as string;
          await putVoiceClip({
            id: `${profileId}:${word.id}`,
            profileId,
            wordId: word.id,
            audio,
            recordedAt: Date.now(),
          });
          setRecordedVoice(word.id, audio);
          setDone((prev) => new Set(prev).add(word.id));
          setBusy(false);
          // straight on to the next word — momentum is the point
          if (at < words.length - 1) setAt((i) => i + 1);
        };
        reader.readAsDataURL(blob);
      };
      recorder.current = rec;
      rec.start();
      setRecording(true);
      setError('');
      window.setTimeout(() => {
        if (rec.state === 'recording') rec.stop();
      }, MAX_SECONDS * 1000);
    } catch {
      setError('No microphone. Check the app’s permissions.');
    }
  };

  const remove = async () => {
    await deleteVoiceClip(`${profileId}:${word.id}`);
    setRecordedVoice(word.id, null);
    setDone((prev) => {
      const next = new Set(prev);
      next.delete(word.id);
      return next;
    });
  };

  const hear = async () => {
    const clips = await getVoiceClips(profileId);
    const clip = clips.find((c) => c.wordId === word.id);
    if (clip) void playAudioAsync(clip.audio);
  };

  if (!word) return null;

  return (
    <section>
      <h3>🎙️ Your voice ({done.size}/{words.length})</h3>
      <p className="ft-hint">
        Record the words {childName} uses most, in your own voice. They play
        instead of the robot voice everywhere in the app — on the board, in
        sentences, in stories. Any word you skip just keeps the robot voice.
      </p>

      <div className="vp-progress" aria-hidden="true">
        <span className="vp-bar" style={{ width: `${(done.size / words.length) * 100}%` }} />
      </div>

      <div className="vp-card">
        <button
          className="vp-nav"
          onClick={() => setAt((i) => Math.max(0, i - 1))}
          disabled={at === 0}
          aria-label="Previous word"
        >
          ‹
        </button>

        <div className="vp-word">
          <span className="vp-emoji" aria-hidden="true">{word.emoji}</span>
          <span className="vp-label">{wordLabel(word, language)}</span>
          <span className="vp-count">
            {at + 1} of {words.length}
            {done.has(word.id) && ' · recorded ✅'}
          </span>
        </div>

        <button
          className="vp-nav"
          onClick={() => setAt((i) => Math.min(words.length - 1, i + 1))}
          disabled={at === words.length - 1}
          aria-label="Next word"
        >
          ›
        </button>
      </div>

      <div className="modal-actions" style={{ justifyContent: 'center' }}>
        <button
          className={`btn-primary vp-rec ${recording ? 'vp-live' : ''}`}
          disabled={busy}
          onClick={() => (recording ? recorder.current?.stop() : void start())}
        >
          {recording ? '⏹ Stop' : busy ? 'Saving…' : '🎙️ Record'}
        </button>
        {done.has(word.id) && !recording && (
          <>
            <button className="btn-secondary" onClick={() => void hear()}>
              ▶️ Hear it
            </button>
            <button className="btn-secondary" onClick={() => void remove()}>
              🗑️ Remove
            </button>
          </>
        )}
      </div>

      {recording && (
        <p className="ft-hint vp-hint">
          Say “{wordLabel(word, language)}” — it stops on its own after{' '}
          {MAX_SECONDS} seconds.
        </p>
      )}
      {error && <p className="gate-error">{error}</p>}
    </section>
  );
}
