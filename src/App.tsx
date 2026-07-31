import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CategoryBar } from './components/CategoryBar';
import { DaySchedule } from './components/DaySchedule';
import { ProfilePicker } from './components/ProfilePicker';
import { QuickBar } from './components/QuickBar';
import { SentenceStrip } from './components/SentenceStrip';
import { Tile } from './components/Tile';

// Modals and quiz load on demand — keeps the first paint on cheap tablets fast
const QuizMode = lazy(() =>
  import('./components/QuizMode').then((m) => ({ default: m.QuizMode })),
);
const SettingsModal = lazy(() =>
  import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal })),
);
const TileEditor = lazy(() =>
  import('./components/TileEditor').then((m) => ({ default: m.TileEditor })),
);
const HistoryModal = lazy(() =>
  import('./components/HistoryModal').then((m) => ({ default: m.HistoryModal })),
);
const WritePad = lazy(() =>
  import('./components/WritePad').then((m) => ({ default: m.WritePad })),
);
const StoryPlayer = lazy(() =>
  import('./components/StoryPlayer').then((m) => ({ default: m.StoryPlayer })),
);
const VideoPlayer = lazy(() =>
  import('./components/VideoPlayer').then((m) => ({ default: m.VideoPlayer })),
);
const StoryEditor = lazy(() =>
  import('./components/StoryEditor').then((m) => ({ default: m.StoryEditor })),
);
const CalmCorner = lazy(() =>
  import('./components/CalmCorner').then((m) => ({ default: m.CalmCorner })),
);
import { CATEGORIES, QUICK_WORDS } from './data/vocabulary';
import { STORIES } from './data/stories';
import { SCRIPT_SETS, TRACE_SETS } from './data/traceSets';
import { UI, wordLabel } from './i18n';
import { useCustomCategories } from './hooks/useCustomCategories';
import { useCustomStories } from './hooks/useCustomStories';
import { useCustomTiles } from './hooks/useCustomTiles';
import { useHome } from './hooks/useHome';
import { useMastery } from './hooks/useMastery';
import { SENTENCE_START, useBigrams } from './hooks/useBigrams';
import { useHistory } from './hooks/useHistory';
import { useProfiles } from './hooks/useProfiles';
import { useSchedule } from './hooks/useSchedule';
import { useSettings } from './hooks/useSettings';
import { useUsage } from './hooks/useUsage';
import { useVideos, videoThumbnail } from './hooks/useVideos';
import { useVideoTime } from './hooks/useVideoTime';
import { shareSentenceCard } from './services/shareCard';
import { playWordSfx } from './services/soundEffects';
import { playPop, playSequence, speakWord } from './services/speech';
import type { Category, CustomTile, Profile, Word } from './types';

const MAX_SENTENCE_WORDS = 10;

type Screen = 'home' | 'talk' | 'learn' | 'quiz' | 'write';

const SCREEN_TABS: {
  id: Screen;
  emoji: string;
  labelKey: 'tabHome' | 'tabTalk' | 'tabLearn' | 'tabQuiz' | 'tabWrite';
}[] = [
  { id: 'home', emoji: '🏠', labelKey: 'tabHome' },
  { id: 'talk', emoji: '💬', labelKey: 'tabTalk' },
  { id: 'learn', emoji: '🎓', labelKey: 'tabLearn' },
  { id: 'quiz', emoji: '🎯', labelKey: 'tabQuiz' },
  { id: 'write', emoji: '✍️', labelKey: 'tabWrite' },
];

/** Root: pick a profile, then run the app keyed to it (remounts on switch) */
export default function App() {
  const { profiles, active, setActive, addProfile, removeProfile } = useProfiles();
  const [pickerOpen, setPickerOpen] = useState(profiles.length > 1);

  if (pickerOpen || !active) {
    return (
      <ProfilePicker
        profiles={profiles}
        onPick={(id) => {
          setActive(id);
          setPickerOpen(false);
        }}
      />
    );
  }

  return (
    <MTalkApp
      key={active.id}
      profile={active}
      profiles={profiles}
      onSwitchProfile={() => setPickerOpen(true)}
      onAddProfile={addProfile}
      onRemoveProfile={removeProfile}
    />
  );
}

interface MTalkAppProps {
  profile: Profile;
  profiles: Profile[];
  onSwitchProfile: () => void;
  onAddProfile: (name: string) => void;
  onRemoveProfile: (id: string) => void;
}

function MTalkApp({ profile, profiles, onSwitchProfile, onAddProfile, onRemoveProfile }: MTalkAppProps) {
  const { settings, update } = useSettings(profile.id);
  const { tiles: customTiles, addTile, updateTile, removeTile } = useCustomTiles(profile.id);
  const { categories: customCategories, addCategory, removeCategory } = useCustomCategories(profile.id);
  const { pinnedIds, addPin, removePin } = useHome(profile.id);
  const { stats, record, masteredCount, practicedCount } = useMastery(profile.id);
  const { recordUse, topWordIds, usedThisWeek, newThisWeek } = useUsage(profile.id);
  const { history, addEntry } = useHistory(profile.id);
  const { recordPair, suggestNext } = useBigrams(profile.id);
  const { videos, addVideo, removeVideo } = useVideos(profile.id);
  const { stories: customStories, addStory, removeStory } = useCustomStories(profile.id);
  const schedule = useSchedule(profile.id);
  const [storyEditorOpen, setStoryEditorOpen] = useState(false);
  const [calmOpen, setCalmOpen] = useState(false);
  const [choiceMode, setChoiceMode] = useState(false);
  const [choicePicks, setChoicePicks] = useState<Word[]>([]);
  const [screen, setScreen] = useState<Screen>('home');
  const [activeCategoryId, setActiveCategoryId] = useState(CATEGORIES[0].id);
  const [sentence, setSentence] = useState<Word[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editorTile, setEditorTile] = useState<CustomTile | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [scanIndex, setScanIndex] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [writeSetId, setWriteSetId] = useState<string | null>('letters');
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ videoId: string; title: string } | null>(null);
  const { remainingSeconds, addSecond, resetToday } = useVideoTime(
    profile.id,
    settings.videoLimitMins,
  );

  const tileToWord = (t: CustomTile): Word => ({
    id: t.id,
    emoji: '⭐',
    en: t.en,
    hi: t.hi || t.en,
    level: 1,
    image: t.image,
    audio: t.audio,
  });

  // Parent-created tiles without a category become "My Words" at the top of Talk
  const myWordsCategory: Category | null = useMemo(() => {
    const words = customTiles.filter((t) => !t.categoryId).map(tileToWord);
    if (words.length === 0) return null;
    return {
      id: 'my-words',
      emoji: '⭐',
      en: 'My Words',
      hi: 'मेरे शब्द',
      color: '#FFF3E0',
      colorDark: '#E65100',
      level: 1,
      group: 'talk',
      words,
    };
  }, [customTiles]);

  // Parent-created categories hold their assigned custom tiles
  const customCategoryList: Category[] = useMemo(
    () =>
      customCategories
        .map((cc) => ({
          id: cc.id,
          emoji: cc.emoji,
          en: cc.name,
          hi: cc.name,
          color: cc.color,
          colorDark: cc.colorDark,
          level: 1 as const,
          group: 'talk' as const,
          words: customTiles.filter((t) => t.categoryId === cc.id).map(tileToWord),
        }))
        .filter((c) => c.words.length > 0),
    [customCategories, customTiles],
  );

  // Parent-added YouTube reward videos become a 🎬 category in Talk
  const videosCategory: Category | null = useMemo(() => {
    if (videos.length === 0) return null;
    return {
      id: 'videos',
      emoji: '🎬',
      en: 'Videos',
      hi: 'वीडियो',
      color: '#FFEBEE',
      colorDark: '#C62828',
      level: 1,
      group: 'talk',
      words: videos.map((v) => ({
        id: v.id,
        emoji: '🎬',
        en: v.title,
        hi: v.title,
        level: 1 as const,
        image: videoThumbnail(v.videoId),
        videoId: v.videoId,
      })),
    };
  }, [videos]);

  // Index every word (built-in, quick bar, custom) by id for lookups
  const wordIndex = useMemo(() => {
    const index = new Map<string, Word>();
    for (const cat of CATEGORIES) for (const w of cat.words) index.set(w.id, w);
    for (const w of QUICK_WORDS) index.set(w.id, w);
    for (const w of myWordsCategory?.words ?? []) index.set(w.id, w);
    for (const cat of customCategoryList) for (const w of cat.words) index.set(w.id, w);
    for (const w of videosCategory?.words ?? []) index.set(w.id, w);
    return index;
  }, [myWordsCategory, customCategoryList, videosCategory]);

  // Auto "Favourites": the child's most-tapped words become the first board
  const favoriteIds = topWordIds(12, 3);
  const favoritesKey = favoriteIds.join(',');
  const favoritesCategory: Category | null = useMemo(() => {
    const words = favoriteIds
      .map((id) => wordIndex.get(id))
      .filter((w): w is Word => Boolean(w));
    if (words.length < 4) return null;
    return {
      id: 'favorites',
      emoji: '💖',
      en: 'Favourites',
      hi: 'पसंदीदा',
      color: '#FCE4EC',
      colorDark: '#C2185B',
      level: 1,
      group: 'talk',
      words,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoritesKey, wordIndex]);

  const allCategories = useMemo(() => {
    const extras = [favoritesCategory, myWordsCategory, ...customCategoryList, videosCategory].filter(
      (c): c is Category => Boolean(c),
    );
    // parent-made social stories join the built-in Stories category
    const base = CATEGORIES.map((c) =>
      c.id === 'stories' && customStories.length > 0
        ? {
            ...c,
            words: [
              ...c.words,
              ...customStories.map((s) => ({
                id: `story-${s.id}`,
                emoji: '📖',
                en: s.title,
                hi: s.title,
                level: 1 as const,
                image: s.pages[0]?.image,
                storyId: `custom:${s.id}`,
              })),
            ],
          }
        : c,
    );
    return [...extras, ...base];
  }, [favoritesCategory, myWordsCategory, customCategoryList, videosCategory, customStories]);

  const groupCategories = allCategories.filter((c) => {
    if (c.level > settings.ageMode) return false;
    if (screen === 'quiz') {
      // quiz can practise any category with enough visible words (not videos)
      if (c.id === 'videos') return false;
      return c.words.filter((w) => w.level <= settings.ageMode).length >= 2;
    }
    if (screen === 'home' || screen === 'write') return false;
    return (c.group ?? 'talk') === screen;
  });

  // 🏠 Home board: pinned words + auto favourites + all custom tiles
  const homeWords = useMemo(() => {
    const seen = new Set<string>();
    const out: Word[] = [];
    const push = (w: Word | undefined) => {
      if (w && !seen.has(w.id)) {
        seen.add(w.id);
        out.push(w);
      }
    };
    for (const id of pinnedIds) push(wordIndex.get(id));
    for (const w of favoritesCategory?.words ?? []) push(w);
    for (const w of myWordsCategory?.words ?? []) push(w);
    for (const cat of customCategoryList) for (const w of cat.words) push(w);
    return out;
  }, [pinnedIds, wordIndex, favoritesCategory, myWordsCategory, customCategoryList]);

  const activeCategory =
    groupCategories.find((c) => c.id === activeCategoryId) ?? groupCategories[0];
  // memoized so QuizMode's "new word set" effect only fires on real changes
  const visibleWords = useMemo(
    () => activeCategory?.words.filter((w) => w.level <= settings.ageMode) ?? [],
    [activeCategory, settings.ageMode],
  );
  // what the tile grid actually shows on the current screen
  const baseWords = screen === 'home' ? homeWords : visibleWords;
  // choice mode narrows the board to two options the parent picked
  const displayWords = choiceMode && choicePicks.length > 0 ? choicePicks : baseWords;

  const triggerCelebration = () => {
    setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 1600);
  };

  // Tracked via ref so handleTileTap stays referentially stable for memoized tiles
  const lastWordIdRef = useRef(SENTENCE_START);
  useEffect(() => {
    lastWordIdRef.current =
      sentence.length > 0 ? sentence[sentence.length - 1].id : SENTENCE_START;
  }, [sentence]);

  const handleTileTap = useCallback(
    (word: Word) => {
      playPop();
      if (settings.vibrateOnTap) navigator.vibrate?.(30);
      if (word.storyId) {
        // story/rhyme tiles open the read-aloud player
        recordUse(word.id);
        setActiveStoryId(word.storyId);
        return;
      }
      if (word.videoId) {
        // video tiles open the timed player (which locks when time is up)
        recordUse(word.id);
        setActiveVideo({ videoId: word.videoId, title: word.en });
        return;
      }
      recordUse(word.id);
      recordPair(lastWordIdRef.current, word.id);
      if (settings.speakOnTap) {
        // fun sound first (moo! / horn), then the word itself
        void playWordSfx(word.id, settings.language, settings.speechRate).then(() =>
          speakWord(word, settings.language, settings.speechRate),
        );
      }
      setSentence((prev) =>
        prev.length >= MAX_SENTENCE_WORDS ? prev : [...prev, word],
      );
    },
    [settings.vibrateOnTap, settings.speakOnTap, settings.language, settings.speechRate, recordUse, recordPair],
  );

  const buzz = () => {
    if (settings.vibrateOnTap) navigator.vibrate?.(30);
  };

  const handleQuickTap = (word: Word) => {
    playPop();
    buzz();
    recordUse(word.id);
    speakWord(word, settings.language, settings.speechRate);
  };

  const playSentence = () => {
    if (sentence.length === 0 || speaking) return;
    setSpeaking(true);
    addEntry(sentence.map((w) => w.id));
    void playSequence(sentence, settings.language, settings.speechRate).then(() => {
      setSpeaking(false);
      triggerCelebration();
    });
  };

  // Scanning access mode: highlight tiles one by one; any tap picks the lit one
  const scanActive = settings.scanning && screen !== 'quiz' && screen !== 'write' && displayWords.length > 0;
  useEffect(() => {
    if (!scanActive) return;
    setScanIndex(0);
    const timer = window.setInterval(
      () => setScanIndex((i) => (i + 1) % displayWords.length),
      1800,
    );
    return () => window.clearInterval(timer);
  }, [scanActive, displayWords]);

  const boardScreen = screen === 'home' || screen === 'talk' || screen === 'learn';

  // ✨ Next-word suggestions learned from the child's own sentences
  const suggestionWords = (boardScreen
    ? suggestNext(
        sentence.length > 0 ? sentence[sentence.length - 1].id : SENTENCE_START,
        4,
      )
    : []
  )
    .map((id) => wordIndex.get(id))
    .filter((w): w is Word => Boolean(w));

  // First–Then schedule words, if the caregiver configured them
  const firstWord = settings.firstThenFirst
    ? wordIndex.get(settings.firstThenFirst)
    : undefined;
  const thenWord = settings.firstThenThen
    ? wordIndex.get(settings.firstThenThen)
    : undefined;

  const handleScanSelect = (e: React.MouseEvent) => {
    if (!scanActive) return;
    e.preventDefault();
    e.stopPropagation();
    const word = displayWords[scanIndex % displayWords.length];
    if (word) handleTileTap(word);
  };

  return (
    <div className="app">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-logo" aria-hidden="true">🗣️</span>
          <span className="brand-name">MTalk</span>
          <span className="brand-tagline">{UI[settings.language].tagline}</span>
        </div>
        <div className="top-actions">
          <button
            className="btn-calm"
            onClick={() => setCalmOpen(true)}
            aria-label="Calm corner — breathing"
            title="Calm corner"
          >
            🫧
          </button>
          <button
            className="btn-profile"
            onClick={onSwitchProfile}
            aria-label={`Current profile ${profile.name} — switch`}
            title="Switch profile"
          >
            <span aria-hidden="true">{profile.emoji}</span>
            <span className="btn-profile-name">{profile.name}</span>
          </button>
          <button
            className="btn-settings"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            title="Settings (grown-ups)"
          >
            ⚙️
          </button>
        </div>
      </header>

      <QuickBar language={settings.language} onTap={handleQuickTap} />

      {boardScreen && screen === 'home' && schedule.steps.length > 0 && (
        <DaySchedule
          steps={schedule.steps}
          doneIds={schedule.doneIds}
          currentIndex={schedule.currentIndex}
          wordIndex={wordIndex}
          language={settings.language}
          onToggle={(id) => {
            playPop();
            schedule.toggleDone(id);
          }}
          onSpeak={(w) => {
            playPop();
            speakWord(w, settings.language, settings.speechRate);
          }}
        />
      )}

      {boardScreen && (
        <>
          {firstWord && thenWord && (
            <div className="first-then" aria-label="First then schedule">
              <button
                className="ft-item"
                onClick={() => {
                  playPop();
                  speakWord(firstWord, settings.language, settings.speechRate);
                }}
              >
                <span className="ft-step">1️⃣ {UI[settings.language].first}</span>
                {firstWord.image ? (
                  <img src={firstWord.image} alt="" className="ft-img" />
                ) : (
                  <span className="ft-emoji">{firstWord.emoji}</span>
                )}
                <span className="ft-name">{wordLabel(firstWord, settings.language)}</span>
              </button>
              <span className="ft-arrow" aria-hidden="true">➡️</span>
              <button
                className="ft-item"
                onClick={() => {
                  playPop();
                  speakWord(thenWord, settings.language, settings.speechRate);
                }}
              >
                <span className="ft-step">2️⃣ {UI[settings.language].then}</span>
                {thenWord.image ? (
                  <img src={thenWord.image} alt="" className="ft-img" />
                ) : (
                  <span className="ft-emoji">{thenWord.emoji}</span>
                )}
                <span className="ft-name">{wordLabel(thenWord, settings.language)}</span>
              </button>
            </div>
          )}

          <SentenceStrip
            words={sentence}
            language={settings.language}
            speaking={speaking}
            hasHistory={history.length > 0}
            onPlay={playSentence}
            onRemove={(index) =>
              setSentence((prev) => prev.filter((_, i) => i !== index))
            }
            onClear={() => setSentence([])}
            onHistory={() => setHistoryOpen(true)}
            onShare={() => {
              playPop();
              void shareSentenceCard(sentence, settings.language);
            }}
          />

          {suggestionWords.length > 0 && (
            <div className="suggest-bar" aria-label="Suggested next words">
              <span className="suggest-icon" aria-hidden="true">✨</span>
              {suggestionWords.map((word) => (
                <button
                  key={word.id}
                  className="suggest-tile"
                  onClick={() => handleTileTap(word)}
                >
                  {word.image ? (
                    <img src={word.image} alt="" className="suggest-img" />
                  ) : (
                    <span className="suggest-emoji">{word.emoji}</span>
                  )}
                  <span className="suggest-label">
                    {wordLabel(word, settings.language)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="board">
        <div className="board-nav">
          <div className="group-tabs" role="tablist" aria-label="Board mode">
            {SCREEN_TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={screen === tab.id}
                className={`group-tab ${screen === tab.id ? 'group-tab-active' : ''}`}
                onClick={() => {
                  playPop();
                  setScreen(tab.id);
                }}
              >
                <span aria-hidden="true">{tab.emoji}</span>
                <span>{UI[settings.language][tab.labelKey]}</span>
              </button>
            ))}
          </div>
          {screen === 'home' ? null : screen === 'write' ? (
            <nav className="category-bar" aria-label="Tracing sets">
              <button
                className={`category-chip ${writeSetId === null ? 'category-chip-active' : ''}`}
                style={{
                  background: writeSetId === null ? '#E91E8C' : '#FFD6E8',
                  color: writeSetId === null ? '#fff' : '#E91E8C',
                }}
                onClick={() => {
                  playPop();
                  setWriteSetId(null);
                }}
              >
                <span className="category-emoji" aria-hidden="true">🎨</span>
                <span>Paint</span>
              </button>
              {[
                ...TRACE_SETS,
                ...(SCRIPT_SETS[settings.language] ? [SCRIPT_SETS[settings.language]] : []),
              ].map((set) => {
                const active = writeSetId === set.id;
                return (
                  <button
                    key={set.id}
                    className={`category-chip ${active ? 'category-chip-active' : ''}`}
                    style={{
                      background: active ? set.colorDark : set.color,
                      color: active ? '#fff' : set.colorDark,
                    }}
                    onClick={() => {
                      playPop();
                      setWriteSetId(set.id);
                    }}
                  >
                    <span className="category-emoji" aria-hidden="true">{set.emoji}</span>
                    <span>{set.name}</span>
                  </button>
                );
              })}
            </nav>
          ) : (
            <CategoryBar
              categories={groupCategories}
              activeId={activeCategory?.id ?? ''}
              language={settings.language}
              ageMode={settings.ageMode}
              onSelect={(id) => {
                playPop();
                setActiveCategoryId(id);
              }}
            />
          )}
        </div>

        {screen === 'write' ? (
          <Suspense fallback={<main className="write-pad" />}>
            <WritePad rate={settings.speechRate} setId={writeSetId} />
          </Suspense>
        ) : screen === 'quiz' ? (
          <Suspense fallback={<main className="quiz" />}>
            <QuizMode
              words={visibleWords}
              language={settings.language}
              rate={settings.speechRate}
              ageMode={settings.ageMode}
              stats={stats}
              onAnswer={record}
              onCelebrate={triggerCelebration}
            />
          </Suspense>
        ) : (
          <main
            className={`tile-grid tile-grid-age-${settings.ageMode} ${settings.roomyGrid ? 'tile-grid-roomy' : ''} ${scanActive ? 'tile-grid-scanning' : ''} ${choiceMode && choicePicks.length > 0 ? 'tile-grid-choice' : ''}`}
            style={
              settings.tileSize
                ? {
                    gridTemplateColumns: `repeat(auto-fill, minmax(${settings.tileSize}px, 1fr))`,
                    gridAutoRows: `${settings.tileSize - 6}px`,
                  }
                : undefined
            }
            onClickCapture={handleScanSelect}
          >
            {screen === 'home' && displayWords.length === 0 && (
              <p className="home-empty">
                🏠 {profile.name}'s board is empty. Grown-ups: add tiles in ⚙️
                Settings → Home tiles, or make custom tiles — favourites appear
                here automatically as words get used.
              </p>
            )}
            {displayWords.map((word, index) => (
              <Tile
                key={word.id}
                word={word}
                language={settings.language}
                showBoth={settings.showBothLanguages}
                color={activeCategory?.color ?? '#FFF8E1'}
                colorDark={activeCategory?.colorDark ?? '#FF8F00'}
                scanned={scanActive && index === scanIndex % displayWords.length}
                onTap={handleTileTap}
              />
            ))}
          </main>
        )}
      </div>

      {celebrate && (
        <div className="celebration" aria-hidden="true">
          {['🌟', '✨', '🎉', '⭐', '🌈', '💫', '🎈', '✨'].map((star, i) => (
            <span key={i} className="celebration-star" style={{ ['--i' as string]: i }}>
              {star}
            </span>
          ))}
        </div>
      )}

      <Suspense fallback={null}>
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          profileId={profile.id}
          profiles={profiles}
          activeProfileId={profile.id}
          onAddProfile={onAddProfile}
          onRemoveProfile={onRemoveProfile}
          customCategories={customCategories}
          onAddCategory={addCategory}
          onRemoveCategory={removeCategory}
          pinnedWords={pinnedIds
            .map((id) => wordIndex.get(id))
            .filter((w): w is Word => Boolean(w))}
          onAddPin={addPin}
          onRemovePin={removePin}
          videos={videos}
          onAddVideo={addVideo}
          onRemoveVideo={removeVideo}
          customStories={customStories}
          onAddStory={() => setStoryEditorOpen(true)}
          onRemoveStory={(id) => void removeStory(id)}
          scheduleSteps={schedule.steps}
          scheduleWords={schedule.steps
            .map((s) => wordIndex.get(s.wordId))
            .filter((w): w is Word => Boolean(w))}
          onAddScheduleStep={schedule.addStep}
          onRemoveScheduleStep={schedule.removeStep}
          onMoveScheduleStep={schedule.moveStep}
          onResetSchedule={schedule.resetDay}
          choiceMode={choiceMode}
          choicePicks={choicePicks}
          onSetChoiceMode={(on, picks) => {
            setChoiceMode(on);
            setChoicePicks(picks);
          }}
          videoRemainingSeconds={remainingSeconds}
          onResetVideoTime={resetToday}
          customTiles={customTiles}
          masteredCount={masteredCount}
          practicedCount={practicedCount}
          topWords={topWordIds(8)
            .map((id) => wordIndex.get(id))
            .filter((w): w is Word => Boolean(w))}
          allWords={[...wordIndex.values()].sort((a, b) => a.en.localeCompare(b.en))}
          usedThisWeek={usedThisWeek}
          newThisWeek={newThisWeek}
          onUpdate={update}
          onAddTile={() => {
            setEditorTile(null);
            setEditorOpen(true);
          }}
          onEditTile={(tile) => {
            setEditorTile(tile);
            setEditorOpen(true);
          }}
          onRemoveTile={(id) => void removeTile(id)}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {editorOpen && (
        <TileEditor
          initial={editorTile ?? undefined}
          categories={customCategories}
          onSave={(tile) =>
            editorTile ? updateTile({ ...editorTile, ...tile }) : addTile(tile)
          }
          onClose={() => setEditorOpen(false)}
        />
      )}

      {activeStoryId && (() => {
        let story = STORIES.find((s) => s.id === activeStoryId);
        if (!story && activeStoryId.startsWith('custom:')) {
          const cs = customStories.find((s) => `custom:${s.id}` === activeStoryId);
          if (cs) {
            story = {
              id: cs.id,
              emoji: '📖',
              kind: 'story',
              title: { en: cs.title },
              lines: { en: cs.pages.map((p) => p.caption) },
              art: cs.pages.map(() => '📖'),
              images: cs.pages.map((p) => p.image),
              audios: cs.pages.map((p) => p.audio ?? null),
            };
          }
        }
        return story ? (
          <StoryPlayer
            story={story}
            language={settings.language}
            rate={settings.speechRate}
            onClose={() => setActiveStoryId(null)}
          />
        ) : null;
      })()}

      {storyEditorOpen && (
        <StoryEditor onSave={addStory} onClose={() => setStoryEditorOpen(false)} />
      )}

      {calmOpen && (
        <CalmCorner
          language={settings.language}
          rate={settings.speechRate}
          onClose={() => setCalmOpen(false)}
        />
      )}

      {activeVideo && (
        <VideoPlayer
          videoId={activeVideo.videoId}
          title={activeVideo.title}
          remainingSeconds={remainingSeconds}
          limitSeconds={settings.videoLimitMins * 60}
          language={settings.language}
          onTick={addSecond}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {historyOpen && (
        <HistoryModal
          history={history}
          wordIndex={wordIndex}
          language={settings.language}
          onPick={(words) => {
            setSentence(words.slice(0, MAX_SENTENCE_WORDS));
            setHistoryOpen(false);
          }}
          onClose={() => setHistoryOpen(false)}
        />
      )}
      </Suspense>
    </div>
  );
}
