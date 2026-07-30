import { useMemo, useRef, useState } from 'react';
import { wordLabel } from '../i18n';
import { putTile } from '../services/db';
import { kidLockAvailable, lockApp, unlockApp } from '../services/kidlock';
import { APP_VERSION } from '../version';
import { profileKey } from '../hooks/useProfiles';
import type { AgeMode, CustomCategory, CustomTile, Profile, Settings, Word } from '../types';

const BACKUP_BASES = ['settings', 'mastery', 'usage', 'history', 'bigrams', 'cats', 'home'];

interface SettingsModalProps {
  settings: Settings;
  profileId: string;
  profiles: Profile[];
  activeProfileId: string;
  customCategories: CustomCategory[];
  pinnedWords: Word[];
  customTiles: CustomTile[];
  masteredCount: number;
  practicedCount: number;
  topWords: Word[];
  allWords: Word[];
  usedThisWeek: number;
  newThisWeek: number;
  onAddProfile: (name: string) => void;
  onRemoveProfile: (id: string) => void;
  onAddCategory: (name: string, emoji: string) => void;
  onRemoveCategory: (id: string) => void;
  onAddPin: (wordId: string) => void;
  onRemovePin: (wordId: string) => void;
  onUpdate: (patch: Partial<Settings>) => void;
  onAddTile: () => void;
  onEditTile: (tile: CustomTile) => void;
  onRemoveTile: (id: string) => void;
  onClose: () => void;
}

const AGE_MODES: { value: AgeMode; en: string; hint: string }[] = [
  { value: 1, en: '🐣 Little', hint: '1–4 yrs · few big tiles' },
  { value: 2, en: '🐥 Junior', hint: '5–9 yrs · more words' },
  { value: 3, en: '🦅 Senior', hint: '10–15 yrs · full board' },
];

/**
 * Caregiver settings. A tiny arithmetic gate keeps young children from
 * wandering in and changing things.
 */
export function SettingsModal({
  settings,
  profileId,
  profiles,
  activeProfileId,
  customCategories,
  pinnedWords,
  customTiles,
  masteredCount,
  practicedCount,
  topWords,
  allWords,
  usedThisWeek,
  newThisWeek,
  onAddProfile,
  onRemoveProfile,
  onAddCategory,
  onRemoveCategory,
  onAddPin,
  onRemovePin,
  onUpdate,
  onAddTile,
  onEditTile,
  onRemoveTile,
  onClose,
}: SettingsModalProps) {
  const importRef = useRef<HTMLInputElement>(null);
  const [backupMessage, setBackupMessage] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('');
  const [pinPick, setPinPick] = useState('');

  const exportBackup = () => {
    const data: Record<string, unknown> = { customTiles };
    for (const base of BACKUP_BASES) {
      try {
        data[`mtalk-${base}`] = JSON.parse(
          localStorage.getItem(profileKey(base, profileId)) ?? 'null',
        );
      } catch {
        data[`mtalk-${base}`] = null;
      }
    }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mtalk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      for (const base of BACKUP_BASES) {
        if (data[`mtalk-${base}`] != null) {
          localStorage.setItem(
            profileKey(base, profileId),
            JSON.stringify(data[`mtalk-${base}`]),
          );
        }
      }
      for (const tile of data.customTiles ?? []) {
        await putTile({ ...(tile as CustomTile), profileId });
      }
      setBackupMessage('Restored! Reloading…');
      window.setTimeout(() => window.location.reload(), 800);
    } catch {
      setBackupMessage('That file could not be read.');
    }
  };
  const gate = useMemo(() => {
    const a = 2 + Math.floor(Math.random() * 6);
    const b = 2 + Math.floor(Math.random() * 6);
    return { a, b, answer: a + b };
  }, []);
  const [unlocked, setUnlocked] = useState(false);
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState(false);

  const tryUnlock = () => {
    if (parseInt(gateInput, 10) === gate.answer) {
      setUnlocked(true);
    } else {
      setGateError(true);
      setGateInput('');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {!unlocked ? (
          <div className="gate">
            <h2>👨‍👩‍👧 For grown-ups</h2>
            <p>
              To open settings, answer: <strong>{gate.a} + {gate.b} = ?</strong>
            </p>
            <input
              type="number"
              inputMode="numeric"
              value={gateInput}
              autoFocus
              onChange={(e) => {
                setGateInput(e.target.value);
                setGateError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
            />
            {gateError && <p className="gate-error">Try again 🙂</p>}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>
                Back
              </button>
              <button className="btn-primary" onClick={tryUnlock}>
                Open
              </button>
            </div>
          </div>
        ) : (
          <div className="settings">
            <h2>⚙️ Settings</h2>

            <section>
              <h3>Language / भाषा / భాష</h3>
              <div className="segmented">
                <button
                  className={settings.language === 'en' ? 'seg-active' : ''}
                  onClick={() => onUpdate({ language: 'en' })}
                >
                  English
                </button>
                <button
                  className={settings.language === 'hi' ? 'seg-active' : ''}
                  onClick={() => onUpdate({ language: 'hi' })}
                >
                  हिन्दी
                </button>
                <button
                  className={settings.language === 'te' ? 'seg-active' : ''}
                  onClick={() => onUpdate({ language: 'te' })}
                >
                  తెలుగు
                </button>
                <button
                  className={settings.language === 'ta' ? 'seg-active' : ''}
                  onClick={() => onUpdate({ language: 'ta' })}
                >
                  தமிழ்
                </button>
                <button
                  className={settings.language === 'kn' ? 'seg-active' : ''}
                  onClick={() => onUpdate({ language: 'kn' })}
                >
                  ಕನ್ನಡ
                </button>
              </div>
            </section>

            <section>
              <h3>Age mode</h3>
              <div className="age-options">
                {AGE_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    className={`age-option ${settings.ageMode === mode.value ? 'age-option-active' : ''}`}
                    onClick={() => onUpdate({ ageMode: mode.value })}
                  >
                    <span className="age-option-name">{mode.en}</span>
                    <span className="age-option-hint">{mode.hint}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3>Speech speed</h3>
              <input
                type="range"
                min="0.5"
                max="1.2"
                step="0.05"
                value={settings.speechRate}
                onChange={(e) => onUpdate({ speechRate: parseFloat(e.target.value) })}
              />
              <div className="range-labels">
                <span>🐢 Slow</span>
                <span>🐇 Fast</span>
              </div>
            </section>

            <section>
              <h3>👨‍👩‍👧 Kids ({profiles.length})</h3>
              <div className="custom-tile-list">
                {profiles.map((p) => (
                  <div key={p.id} className="custom-tile-row">
                    <span className="profile-row-avatar">{p.emoji}</span>
                    <span className="custom-tile-name">
                      {p.name}
                      {p.id === activeProfileId && ' ✅'}
                    </span>
                    {profiles.length > 1 && p.id !== activeProfileId && (
                      <button
                        className="btn-delete"
                        onClick={() => onRemoveProfile(p.id)}
                        aria-label={`Delete profile ${p.name}`}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="add-row">
                <input
                  className="text-field add-row-field"
                  type="text"
                  placeholder="New kid's name"
                  value={newProfileName}
                  maxLength={20}
                  onChange={(e) => setNewProfileName(e.target.value)}
                />
                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (newProfileName.trim()) {
                      onAddProfile(newProfileName);
                      setNewProfileName('');
                    }
                  }}
                >
                  ➕ Add kid
                </button>
              </div>
            </section>

            <section>
              <h3>📁 Tile categories ({customCategories.length})</h3>
              <div className="custom-tile-list">
                {customCategories.map((c) => (
                  <div key={c.id} className="custom-tile-row">
                    <span className="profile-row-avatar">{c.emoji}</span>
                    <span className="custom-tile-name">{c.name}</span>
                    <button
                      className="btn-delete"
                      onClick={() => onRemoveCategory(c.id)}
                      aria-label={`Delete category ${c.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              <div className="add-row">
                <input
                  className="text-field add-row-emoji"
                  type="text"
                  placeholder="😀"
                  value={newCatEmoji}
                  maxLength={4}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                />
                <input
                  className="text-field add-row-field"
                  type="text"
                  placeholder="Category name (e.g. School friends)"
                  value={newCatName}
                  maxLength={24}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (newCatName.trim()) {
                      onAddCategory(newCatName, newCatEmoji);
                      setNewCatName('');
                      setNewCatEmoji('');
                    }
                  }}
                >
                  ➕ Add
                </button>
              </div>
              <p className="ft-hint">
                Put custom tiles into a category from the tile editor. Categories
                appear in the Talk menu.
              </p>
            </section>

            <section>
              <h3>🏠 Home tiles ({pinnedWords.length})</h3>
              <div className="top-words">
                {pinnedWords.map((w) => (
                  <button
                    key={w.id}
                    className="top-word-chip"
                    onClick={() => onRemovePin(w.id)}
                    title="Remove from Home"
                  >
                    {w.image ? '⭐' : w.emoji} {w.en} ✖
                  </button>
                ))}
              </div>
              <div className="add-row">
                <select
                  className="text-field add-row-field"
                  value={pinPick}
                  onChange={(e) => setPinPick(e.target.value)}
                >
                  <option value="">— Pick a word for Home —</option>
                  {allWords.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.image ? '⭐' : w.emoji} {w.en}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (pinPick) {
                      onAddPin(pinPick);
                      setPinPick('');
                    }
                  }}
                >
                  ➕ Pin
                </button>
              </div>
              <p className="ft-hint">
                The 🏠 Home tab shows pinned words plus the child's favourites and
                custom tiles.
              </p>
            </section>

            <section>
              <h3>⭐ My tiles ({customTiles.length})</h3>
              <div className="custom-tile-list">
                {customTiles.map((tile) => (
                  <div key={tile.id} className="custom-tile-row">
                    <img src={tile.image} alt="" className="custom-tile-thumb" />
                    <span className="custom-tile-name">
                      {tile.en}
                      {tile.audio && ' 🎙️'}
                    </span>
                    <button
                      className="btn-delete"
                      onClick={() => onEditTile(tile)}
                      aria-label={`Edit ${tile.en}`}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => onRemoveTile(tile.id)}
                      aria-label={`Delete ${tile.en}`}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn-secondary btn-add-tile" onClick={onAddTile}>
                ➕ Add a tile (photo + voice)
              </button>
            </section>

            <section>
              <h3>🎯 Quiz progress</h3>
              <p className="progress-line">
                <strong>{masteredCount}</strong> words mastered ·{' '}
                <strong>{practicedCount}</strong> practised
              </p>
            </section>

            <section>
              <h3>📊 Talking insights</h3>
              <p className="progress-line">
                <strong>{usedThisWeek}</strong> different words this week ·{' '}
                <strong>{newThisWeek}</strong> new
              </p>
              {topWords.length > 0 && (
                <div className="top-words">
                  {topWords.map((w) => (
                    <span key={w.id} className="top-word-chip">
                      {w.image ? '⭐' : w.emoji} {wordLabel(w, settings.language)}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="toggles">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showBothLanguages}
                  onChange={(e) => onUpdate({ showBothLanguages: e.target.checked })}
                />
                Show both languages on tiles
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.speakOnTap}
                  onChange={(e) => onUpdate({ speakOnTap: e.target.checked })}
                />
                Speak each word when tapped
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.vibrateOnTap}
                  onChange={(e) => onUpdate({ vibrateOnTap: e.target.checked })}
                />
                Vibrate on tap
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.roomyGrid}
                  onChange={(e) => onUpdate({ roomyGrid: e.target.checked })}
                />
                Extra space between tiles (easier aiming)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.scanning}
                  onChange={(e) => onUpdate({ scanning: e.target.checked })}
                />
                Scanning mode — tiles light up in turn, tap anywhere to choose
              </label>
            </section>

            <section>
              <h3>1️⃣➡️2️⃣ First–Then schedule</h3>
              <p className="ft-hint">
                Show the child what happens now and what comes after — e.g. First
                homework, then TV.
              </p>
              <div className="ft-selects">
                <select
                  value={settings.firstThenFirst ?? ''}
                  onChange={(e) => onUpdate({ firstThenFirst: e.target.value || null })}
                >
                  <option value="">— First —</option>
                  {allWords.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.image ? '⭐' : w.emoji} {w.en}
                    </option>
                  ))}
                </select>
                <select
                  value={settings.firstThenThen ?? ''}
                  onChange={(e) => onUpdate({ firstThenThen: e.target.value || null })}
                >
                  <option value="">— Then —</option>
                  {allWords.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.image ? '⭐' : w.emoji} {w.en}
                    </option>
                  ))}
                </select>
                {(settings.firstThenFirst || settings.firstThenThen) && (
                  <button
                    className="btn-secondary"
                    onClick={() => onUpdate({ firstThenFirst: null, firstThenThen: null })}
                  >
                    ✖ Clear
                  </button>
                )}
              </div>
            </section>

            {kidLockAvailable && (
              <section>
                <h3>🔒 Kid lock (this device)</h3>
                <p className="ft-hint">
                  Pins MTalk to the screen so the child cannot open other apps or
                  leave. To release it, come back here and tap Unlock (settings
                  stay protected by the sum question), or hold the Back + Recent
                  buttons together.
                </p>
                <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      void lockApp();
                      onClose();
                    }}
                  >
                    🔒 Lock into MTalk
                  </button>
                  <button className="btn-secondary" onClick={() => void unlockApp()}>
                    🔓 Unlock
                  </button>
                </div>
                <p className="ft-hint">
                  If locking does nothing, first enable "App pinning" in Android
                  Settings → Security, then try again.
                </p>
              </section>
            )}

            <section>
              <h3>💾 Backup</h3>
              <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
                <button className="btn-secondary" onClick={exportBackup}>
                  💾 Save backup
                </button>
                <button className="btn-secondary" onClick={() => importRef.current?.click()}>
                  📂 Restore
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={(e) => void importBackup(e.target.files?.[0])}
                />
              </div>
              {backupMessage && <p className="progress-line">{backupMessage}</p>}
            </section>

            <div className="modal-actions">
              <button className="btn-primary" onClick={onClose}>
                Done ✅
              </button>
            </div>
            <p className="version-line">MTalk v{APP_VERSION}</p>
          </div>
        )}
      </div>
    </div>
  );
}
