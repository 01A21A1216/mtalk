import { useEffect, useRef, useState } from 'react';
import { playAudioAsync } from '../services/speech';
import {
  generateImage,
  imageGenAvailable,
  searchImages,
  toTileDataUrl,
  type ImageResult,
} from '../services/imageSources';
import type { CustomCategory, CustomTile } from '../types';

interface TileEditorProps {
  /** When set, the editor updates this tile instead of creating a new one */
  initial?: CustomTile;
  /** Category a *new* tile should start in — set when adding from Categories */
  presetCategoryId?: string;
  categories: CustomCategory[];
  onSave: (tile: Omit<CustomTile, 'id' | 'createdAt' | 'profileId'>) => Promise<void>;
  onClose: () => void;
}

/** Downscale the chosen photo so tiles stay small enough for IndexedDB */
function resizeImage(file: File, maxSize = 320): Promise<string> {
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
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('could not read image'));
    };
    img.src = url;
  });
}

export function TileEditor({
  initial,
  presetCategoryId,
  categories,
  onSave,
  onClose,
}: TileEditorProps) {
  const [en, setEn] = useState(initial?.en ?? '');
  const [hi, setHi] = useState(initial?.hi ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? presetCategoryId ?? '');
  const [image, setImage] = useState<string | null>(initial?.image ?? null);
  const [audio, setAudio] = useState<string | null>(initial?.audio ?? null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Where the picture is coming from: camera, gallery, web search or AI
  const [source, setSource] = useState<'camera' | 'upload' | 'search' | 'ai' | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const categoryName = categories.find((c) => c.id === categoryId)?.name;

  const runSearch = async (term: string) => {
    const q = term.trim();
    if (!q) {
      setError('Type the name of the tile first, then search.');
      return;
    }
    setQuery(q);
    setBusy(true);
    setError('');
    try {
      setResults(await searchImages(q));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setBusy(false);
    }
  };

  const applyResult = async (url: string) => {
    setBusy(true);
    try {
      setImage(await toTileDataUrl(url));
      setSource(null);
      setError('');
    } catch {
      setError('That picture could not be used. Try another one.');
    } finally {
      setBusy(false);
    }
  };

  const runGenerate = async () => {
    if (!en.trim()) {
      setError('Type the name of the tile first, then make a picture.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      setImage(await generateImage(en, categoryName));
      setSource(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not make a picture.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    return () => {
      // stop mic if the editor closes mid-recording
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      setImage(await resizeImage(file));
      setError('');
    } catch {
      setError('Could not read that photo. Try another one.');
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    // getUserMedia only exists on secure origins (https / localhost / the app)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        window.isSecureContext
          ? 'This browser cannot record audio.'
          : 'Recording needs a secure connection — open the https:// address or use the installed app.',
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
        reader.onload = () => setAudio(reader.result as string);
        reader.readAsDataURL(blob);
        setRecording(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setError('');
      // safety stop after 10 s — tile clips should be short
      window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 10000);
    } catch {
      setError('Microphone not available. Check app permissions.');
    }
  };

  const save = async () => {
    if (!en.trim()) {
      setError('Please type a name for the tile.');
      return;
    }
    if (!image) {
      setError('Please add a photo.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        en: en.trim(),
        hi: hi.trim(),
        image,
        audio: audio ?? undefined,
        categoryId: categoryId || undefined,
      });
      onClose();
    } catch {
      setError('Could not save. Storage may be full.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial ? '✏️ Edit tile' : '⭐ New tile'}</h2>

        <section>
          <h3>Photo</h3>
          <label className="photo-picker">
            {image ? (
              <img src={image} alt="Tile preview" className="photo-preview" />
            ) : (
              <span className="photo-placeholder">📷 Tap to take or choose a photo</span>
            )}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => pickImage(e.target.files?.[0])}
            />
          </label>

          <div className="photo-sources">
            <button
              className={`btn-secondary ${source === 'camera' ? 'seg-active' : ''}`}
              onClick={() => {
                setSource('camera');
                cameraRef.current?.click();
              }}
            >
              📸 Camera
            </button>
            <button
              className={`btn-secondary ${source === 'upload' ? 'seg-active' : ''}`}
              onClick={() => {
                setSource('upload');
                galleryRef.current?.click();
              }}
            >
              🖼️ Gallery
            </button>
            <button
              className={`btn-secondary ${source === 'search' ? 'seg-active' : ''}`}
              onClick={() => {
                setSource(source === 'search' ? null : 'search');
                if (!results.length && en.trim()) void runSearch(en);
              }}
            >
              🔍 Search web
            </button>
            {imageGenAvailable() && (
              <button
                className={`btn-secondary ${source === 'ai' ? 'seg-active' : ''}`}
                onClick={() => {
                  setSource('ai');
                  void runGenerate();
                }}
              >
                ✨ Make one
              </button>
            )}
          </div>

          {/* capture= asks Android for the camera app directly, so no extra
              permission is needed inside the WebView */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => pickImage(e.target.files?.[0])}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pickImage(e.target.files?.[0])}
          />

          {source === 'search' && (
            <div className="photo-panel">
              <div className="add-row">
                <input
                  className="text-field add-row-field"
                  type="search"
                  placeholder="What is it a picture of?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void runSearch(query || en)}
                />
                <button className="btn-secondary" onClick={() => void runSearch(query || en)}>
                  🔍 Search
                </button>
              </div>
              {busy && <p className="ft-hint">Looking…</p>}
              {!busy && results.length > 0 && (
                <div className="photo-results">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      className="photo-result"
                      title={`${r.title} — ${r.license}`}
                      onClick={() => void applyResult(r.thumbnail)}
                    >
                      <img src={r.thumbnail} alt={r.title} loading="lazy" />
                      <span className="photo-licence">{r.license || 'CC'}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="ft-hint">
                Pictures come from Openverse and are Creative Commons licensed.
                A real photo of the child's own thing usually works better.
              </p>
            </div>
          )}

          {source === 'ai' && (
            <div className="photo-panel">
              {busy ? (
                <p className="ft-hint">Making a picture of "{en || '…'}"…</p>
              ) : (
                <button className="btn-secondary" onClick={() => void runGenerate()}>
                  ✨ Try again
                </button>
              )}
            </div>
          )}
        </section>

        <section>
          <h3>Name</h3>
          <input
            className="text-field"
            type="text"
            placeholder="English — e.g. Chintu (my brother)"
            value={en}
            maxLength={30}
            onChange={(e) => setEn(e.target.value)}
          />
          <input
            className="text-field"
            type="text"
            placeholder="हिन्दी (optional)"
            value={hi}
            maxLength={30}
            onChange={(e) => setHi(e.target.value)}
          />
        </section>

        {categories.length > 0 && (
          <section>
            <h3>Category</h3>
            <select
              className="text-field"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">⭐ My Words</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </section>
        )}

        <section>
          <h3>Voice (optional — otherwise the app voice reads the name)</h3>
          <div className="record-row">
            <button
              className={`btn-record ${recording ? 'btn-record-active' : ''}`}
              onClick={toggleRecording}
            >
              {recording ? '⏹ Stop' : audio ? '🎙️ Re-record' : '🎙️ Record'}
            </button>
            {audio && !recording && (
              <button className="btn-secondary" onClick={() => void playAudioAsync(audio)}>
                ▶️ Play
              </button>
            )}
            {recording && <span className="recording-dot">● recording…</span>}
          </div>
        </section>

        {error && <p className="gate-error">{error}</p>}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save tile ✅'}
          </button>
        </div>
      </div>
    </div>
  );
}
