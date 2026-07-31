import { useMemo, useRef, useState } from 'react';
import { LANGUAGE_NAMES, LANGUAGE_ORDER, wordLabel } from '../i18n';
import { putTile } from '../services/db';
import { kidLockAvailable, lockApp, unlockApp } from '../services/kidlock';
import { APP_VERSION } from '../version';
import { profileKey } from '../hooks/useProfiles';
import { shareProgressReport } from '../services/progressReport';
import type { AgeMode, CustomCategory, CustomStory, CustomTile, Profile, ScheduleStep, Settings, VideoTile, Word } from '../types';

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
  videos: VideoTile[];
  onAddVideo: (url: string, title: string) => boolean;
  onRemoveVideo: (id: string) => void;
  videoRemainingSeconds: number;
  onResetVideoTime: () => void;
  customStories: CustomStory[];
  onAddStory: () => void;
  onRemoveStory: (id: string) => void;
  scheduleSteps: ScheduleStep[];
  scheduleWords: Word[];
  onAddScheduleStep: (wordId: string, time?: string) => void;
  onRemoveScheduleStep: (id: string) => void;
  onMoveScheduleStep: (id: string, delta: number) => void;
  onResetSchedule: () => void;
  choiceMode: boolean;
  choicePicks: Word[];
  onSetChoiceMode: (on: boolean, picks: Word[]) => void;
  onUpdate: (patch: Partial<Settings>) => void;
  onAddTile: () => void;
  onEditTile: (tile: CustomTile) => void;
  onRemoveTile: (id: string) => void;
  onClose: () => void;
}

/** "Water" — used to preview how tiles will look in both languages */
const WATER_SAMPLE: Word = {
  id: 'water',
  emoji: '💧',
  en: 'Water',
  hi: 'पानी',
  level: 1,
};

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
  videos,
  onAddVideo,
  onRemoveVideo,
  videoRemainingSeconds,
  onResetVideoTime,
  customStories,
  onAddStory,
  onRemoveStory,
  scheduleSteps,
  scheduleWords,
  onAddScheduleStep,
  onRemoveScheduleStep,
  onMoveScheduleStep,
  onResetSchedule,
  choiceMode,
  choicePicks,
  onSetChoiceMode,
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
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoError, setVideoError] = useState('');
  const [stepPick, setStepPick] = useState('');
  const [stepTime, setStepTime] = useState('');
  const [choiceA, setChoiceA] = useState('');
  const [choiceB, setChoiceB] = useState('');

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
    <div
      className={`modal-backdrop ${unlocked ? 'modal-backdrop-full' : ''}`}
      onClick={unlocked ? undefined : onClose}
    >
      <div
        className={`modal ${unlocked ? 'modal-full' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
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
            <header className="settings-bar">
              <h2>⚙️ Settings</h2>
              <button className="settings-close" onClick={onClose} aria-label="Close settings">
                ✖
              </button>
            </header>

            <div className="settings-body">
            <section>
              <h3>App language / भाषा / భాష</h3>
              <p className="ft-hint">
                The big label on every tile, and all app text.
              </p>
              <div className="segmented">
                {LANGUAGE_ORDER.map((lang) => (
                  <button
                    key={lang}
                    className={settings.language === lang ? 'seg-active' : ''}
                    onClick={() => onUpdate({ language: lang })}
                  >
                    {LANGUAGE_NAMES[lang]}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3>🏡 Mother tongue</h3>
              <p className="ft-hint">
                The language spoken at home. It appears as a small caption under
                each tile, so the child sees both — helpful when school or
                therapy uses a different language.
              </p>
              <div className="segmented">
                <button
                  className={!settings.motherTongue ? 'seg-active' : ''}
                  onClick={() => onUpdate({ motherTongue: null })}
                >
                  None
                </button>
                {LANGUAGE_ORDER.filter((l) => l !== settings.language).map((lang) => (
                  <button
                    key={lang}
                    className={settings.motherTongue === lang ? 'seg-active' : ''}
                    onClick={() => onUpdate({ motherTongue: lang })}
                  >
                    {LANGUAGE_NAMES[lang]}
                  </button>
                ))}
              </div>
              {settings.motherTongue && settings.motherTongue !== settings.language && (
                <>
                  <div className="mt-preview" aria-hidden="true">
                    <span className="mt-preview-emoji">💧</span>
                    <span className="mt-preview-main">
                      {wordLabel(WATER_SAMPLE, settings.language)}
                    </span>
                    <span className="mt-preview-sub">
                      {wordLabel(WATER_SAMPLE, settings.motherTongue)}
                    </span>
                  </div>
                  <label className="mt-toggle">
                    <input
                      type="checkbox"
                      checked={settings.speakMotherTongue}
                      onChange={(e) => onUpdate({ speakMotherTongue: e.target.checked })}
                    />
                    Also say each word in {LANGUAGE_NAMES[settings.motherTongue]}
                  </label>
                </>
              )}
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
              <h3>📖 My stories ({customStories.length})</h3>
              <p className="ft-hint">
                Make picture stories about the child's own life — "Going to
                school", "Haircut day" — with photos, a line per page, and your
                voice. They appear in Learn → Stories.
              </p>
              <div className="custom-tile-list">
                {customStories.map((s) => (
                  <div key={s.id} className="custom-tile-row">
                    <img src={s.pages[0]?.image} alt="" className="custom-tile-thumb" />
                    <span className="custom-tile-name">
                      {s.title} · {s.pages.length} pages
                    </span>
                    <button
                      className="btn-delete"
                      onClick={() => onRemoveStory(s.id)}
                      aria-label={`Delete story ${s.title}`}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn-secondary btn-add-tile" onClick={onAddStory}>
                ➕ New story (photos + voice)
              </button>
            </section>

            <section>
              <h3>🎬 Reward videos ({videos.length})</h3>
              <div className="custom-tile-list">
                {videos.map((v) => (
                  <div key={v.id} className="custom-tile-row">
                    <span className="profile-row-avatar">🎬</span>
                    <span className="custom-tile-name">{v.title}</span>
                    <button
                      className="btn-delete"
                      onClick={() => onRemoveVideo(v.id)}
                      aria-label={`Delete video ${v.title}`}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              <div className="add-row">
                <input
                  className="text-field add-row-field"
                  type="text"
                  placeholder="YouTube link (youtube.com/watch?v=…)"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    setVideoError('');
                  }}
                />
                <input
                  className="text-field add-row-field"
                  type="text"
                  placeholder="Name (e.g. ABC song)"
                  value={videoTitle}
                  maxLength={30}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (onAddVideo(videoUrl, videoTitle)) {
                      setVideoUrl('');
                      setVideoTitle('');
                    } else {
                      setVideoError('That does not look like a YouTube link.');
                    }
                  }}
                >
                  ➕ Add
                </button>
              </div>
              {videoError && <p className="gate-error">{videoError}</p>}

              <h3 style={{ marginTop: 14 }}>⏳ Daily video time</h3>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={settings.videoLimitMins}
                onChange={(e) => onUpdate({ videoLimitMins: parseInt(e.target.value, 10) })}
              />
              <div className="range-labels">
                <span>5 min</span>
                <span>
                  <strong>{settings.videoLimitMins} min/day</strong>
                </span>
                <span>60 min</span>
              </div>
              <p className="progress-line">
                Left today: <strong>{Math.ceil(videoRemainingSeconds / 60)} min</strong>
                <button
                  className="btn-secondary"
                  style={{ marginLeft: 10 }}
                  onClick={onResetVideoTime}
                >
                  🔄 Reset today's time
                </button>
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
              <button
                className="btn-secondary btn-add-tile"
                style={{ marginTop: 10 }}
                onClick={() =>
                  void shareProgressReport({
                    childName:
                      profiles.find((p) => p.id === activeProfileId)?.name ?? 'My Kid',
                    language: settings.language,
                    usedThisWeek,
                    newThisWeek,
                    masteredCount,
                    practicedCount,
                    topWords,
                  })
                }
              >
                📄 Share progress report (for therapist / family)
              </button>
            </section>

            <section className="toggles">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showBothLanguages}
                  onChange={(e) => onUpdate({ showBothLanguages: e.target.checked })}
                />
                Show the mother-tongue caption on tiles
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
              <h3>🗓️ Day plan ({scheduleSteps.length} steps)</h3>
              <p className="ft-hint">
                The child's routine for the whole day, shown on the 🏠 Home tab.
                They tap ⬜ as each step is finished; ticks clear every morning.
              </p>
              <div className="custom-tile-list">
                {scheduleSteps.map((step, i) => {
                  const w = scheduleWords[i];
                  return (
                    <div key={step.id} className="custom-tile-row">
                      <span className="profile-row-avatar">{w?.image ? '⭐' : w?.emoji}</span>
                      <span className="custom-tile-name">
                        {step.time ? `${step.time} · ` : ''}
                        {w ? wordLabel(w, settings.language) : '—'}
                      </span>
                      <button
                        className="btn-delete"
                        onClick={() => onMoveScheduleStep(step.id, -1)}
                        aria-label="Move earlier"
                      >
                        ⬆️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => onMoveScheduleStep(step.id, 1)}
                        aria-label="Move later"
                      >
                        ⬇️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => onRemoveScheduleStep(step.id)}
                        aria-label="Delete step"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="add-row">
                <input
                  className="text-field add-row-emoji"
                  type="text"
                  placeholder="8:00"
                  value={stepTime}
                  maxLength={6}
                  onChange={(e) => setStepTime(e.target.value)}
                />
                <select
                  className="text-field add-row-field"
                  value={stepPick}
                  onChange={(e) => setStepPick(e.target.value)}
                >
                  <option value="">— Add a step —</option>
                  {allWords.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.image ? '⭐' : w.emoji} {w.en}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (stepPick) {
                      onAddScheduleStep(stepPick, stepTime);
                      setStepPick('');
                      setStepTime('');
                    }
                  }}
                >
                  ➕ Add
                </button>
                {scheduleSteps.length > 0 && (
                  <button className="btn-secondary" onClick={onResetSchedule}>
                    🔄 Clear ticks
                  </button>
                )}
              </div>
            </section>

            <section>
              <h3>✌️ Choice mode</h3>
              <p className="ft-hint">
                Show only two tiles so the child picks between them — "roti or
                rice?". Great for starting communication.
              </p>
              <div className="add-row">
                <select
                  className="text-field add-row-field"
                  value={choiceA}
                  onChange={(e) => setChoiceA(e.target.value)}
                >
                  <option value="">— First choice —</option>
                  {allWords.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.image ? '⭐' : w.emoji} {w.en}
                    </option>
                  ))}
                </select>
                <select
                  className="text-field add-row-field"
                  value={choiceB}
                  onChange={(e) => setChoiceB(e.target.value)}
                >
                  <option value="">— Second choice —</option>
                  {allWords.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.image ? '⭐' : w.emoji} {w.en}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const a = allWords.find((w) => w.id === choiceA);
                    const b = allWords.find((w) => w.id === choiceB);
                    if (a && b) {
                      onSetChoiceMode(true, [a, b]);
                      onClose();
                    }
                  }}
                >
                  ▶️ Start choice
                </button>
                {choiceMode && (
                  <button className="btn-secondary" onClick={() => onSetChoiceMode(false, [])}>
                    ✖ Stop choice mode
                  </button>
                )}
              </div>
              {choiceMode && choicePicks.length === 2 && (
                <p className="progress-line">
                  Active: {choicePicks[0].en} vs {choicePicks[1].en}
                </p>
              )}
            </section>

            <section>
              <h3>🔲 Tile size</h3>
              <div className="segmented">
                {(
                  [
                    [0, 'Auto'],
                    [100, 'Small'],
                    [130, 'Medium'],
                    [170, 'Large'],
                    [210, 'Huge'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    className={settings.tileSize === value ? 'seg-active' : ''}
                    onClick={() => onUpdate({ tileSize: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
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
            </div>

            <footer className="settings-foot">
              <p className="version-line">MTalk v{APP_VERSION}</p>
              <button className="btn-primary" onClick={onClose}>
                Done ✅
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
