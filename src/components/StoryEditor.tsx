import { useEffect, useRef, useState } from 'react';
import { playAudioAsync } from '../services/speech';
import type { CustomStory, CustomStoryPage } from '../types';

interface StoryEditorProps {
  onSave: (story: Omit<CustomStory, 'id' | 'createdAt' | 'profileId'>) => Promise<void>;
  onClose: () => void;
}

function resizeImage(file: File, maxSize = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('could not read image'));
    };
    img.src = url;
  });
}

/**
 * Social story builder: parents assemble photo pages with captions and an
 * optional recorded narration for each page ("Going to school", "Haircut day").
 */
export function StoryEditor({ onSave, onClose }: StoryEditorProps) {
  const [title, setTitle] = useState('');
  const [pages, setPages] = useState<CustomStoryPage[]>([]);
  // draft page being composed
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [draftCaption, setDraftCaption] = useState('');
  const [draftAudio, setDraftAudio] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      setDraftImage(await resizeImage(file));
      setError('');
    } catch {
      setError('Could not read that photo.');
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        window.isSecureContext
          ? 'This browser cannot record audio.'
          : 'Recording needs the https:// address or the installed app.',
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const reader = new FileReader();
        reader.onload = () => setDraftAudio(reader.result as string);
        reader.readAsDataURL(blob);
        setRecording(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setError('');
      window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 30000);
    } catch {
      setError('Microphone not available. Check app permissions.');
    }
  };

  const addPage = () => {
    if (!draftImage) {
      setError('Add a photo for this page.');
      return;
    }
    if (!draftCaption.trim()) {
      setError('Write a short line for this page.');
      return;
    }
    setPages((prev) => [
      ...prev,
      { image: draftImage, caption: draftCaption.trim(), audio: draftAudio ?? undefined },
    ]);
    setDraftImage(null);
    setDraftCaption('');
    setDraftAudio(null);
    setError('');
  };

  const save = async () => {
    if (!title.trim()) {
      setError('Give the story a name.');
      return;
    }
    if (pages.length === 0) {
      setError('Add at least one page.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ title: title.trim(), pages });
      onClose();
    } catch {
      setError('Could not save. Storage may be full.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>📖 New story</h2>

        <section>
          <h3>Story name</h3>
          <input
            className="text-field"
            type="text"
            placeholder='e.g. "Going to school"'
            value={title}
            maxLength={40}
            onChange={(e) => setTitle(e.target.value)}
          />
        </section>

        {pages.length > 0 && (
          <section>
            <h3>Pages ({pages.length})</h3>
            <div className="custom-tile-list">
              {pages.map((p, i) => (
                <div key={i} className="custom-tile-row">
                  <img src={p.image} alt="" className="custom-tile-thumb" />
                  <span className="custom-tile-name">
                    {i + 1}. {p.caption}
                    {p.audio && ' 🎙️'}
                  </span>
                  <button
                    className="btn-delete"
                    onClick={() => setPages((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Delete page ${i + 1}`}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3>Add page {pages.length + 1}</h3>
          <label className="photo-picker">
            {draftImage ? (
              <img src={draftImage} alt="Page preview" className="photo-preview" />
            ) : (
              <span className="photo-placeholder">📷 Tap to take or choose a photo</span>
            )}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                void pickImage(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          <input
            className="text-field"
            type="text"
            placeholder="One line for this page (spoken aloud)"
            value={draftCaption}
            maxLength={90}
            onChange={(e) => setDraftCaption(e.target.value)}
          />
          <div className="record-row">
            <button
              className={`btn-record ${recording ? 'btn-record-active' : ''}`}
              onClick={toggleRecording}
            >
              {recording ? '⏹ Stop' : draftAudio ? '🎙️ Re-record' : '🎙️ Record voice (optional)'}
            </button>
            {draftAudio && !recording && (
              <button className="btn-secondary" onClick={() => void playAudioAsync(draftAudio)}>
                ▶️ Play
              </button>
            )}
            {recording && <span className="recording-dot">● recording…</span>}
            <button className="btn-secondary" onClick={addPage}>
              ➕ Add page
            </button>
          </div>
        </section>

        {error && <p className="gate-error">{error}</p>}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save story ✅'}
          </button>
        </div>
      </div>
    </div>
  );
}
