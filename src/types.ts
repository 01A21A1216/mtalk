export type Language = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'mr' | 'bn';

/** Age tiers: 1 = Little (1-4 yrs), 2 = Junior (5-9 yrs), 3 = Senior (10-15 yrs) */
export type AgeMode = 1 | 2 | 3;

export interface Word {
  id: string;
  emoji: string;
  en: string;
  hi: string;
  /** Text actually spoken aloud, when different from the label (e.g. "Amma" vs "Mom") */
  speakEn?: string;
  speakHi?: string;
  /** Minimum age tier this word appears in */
  level: AgeMode;
  /** Custom tile: photo (data URL) shown instead of the emoji */
  image?: string;
  /** Custom tile: recorded voice (data URL) played instead of TTS */
  audio?: string;
  /** Tapping this tile opens the story player instead of speaking a word */
  storyId?: string;
  /** Tapping this tile opens the timed YouTube player */
  videoId?: string;
  /** Starts a labelled block in the grid (key into i18n SECTIONS) */
  section?: string;
}

/** One page of a parent-made social story */
export interface CustomStoryPage {
  image: string;
  caption: string;
  audio?: string;
}

/** A parent-made social story (photos + captions + optional recorded voice) */
export interface CustomStory {
  id: string;
  profileId: string;
  title: string;
  pages: CustomStoryPage[];
  createdAt: number;
}

/** A parent-added YouTube reward video */
export interface VideoTile {
  id: string;
  title: string;
  videoId: string;
  createdAt: number;
}

/** A parent-created tile persisted in IndexedDB */
export interface CustomTile {
  id: string;
  en: string;
  hi: string;
  image: string;
  audio?: string;
  /** What to say when it differs from the label (imported OBF vocalization) */
  speak?: string;
  createdAt: number;
  /** Owning child profile (legacy tiles belong to the first profile) */
  profileId?: string;
  /** Custom category the tile lives in; empty = "My Words" */
  categoryId?: string;
}

/** A child profile — all data (tiles, progress, settings) is per-profile */
export interface Profile {
  id: string;
  name: string;
  emoji: string;
}

/** Grown-up roles: admin runs the tablet, parent looks after their own kids */
export type UserRole = 'admin' | 'parent';

/** How a PIN was hashed — 'weak' records are upgraded on the next sign-in */
export type PinAlgo = 'pbkdf2' | 'weak';

/** A grown-up account (caregiver login), stored on the device */
export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  /** Optional — links this account to a cloud login of the same address */
  email?: string;
  /** Child profiles a parent may open; ignored for admins, who see all */
  kidIds: string[];
  pinHash: string;
  pinSalt: string;
  pinAlgo: PinAlgo;
  /** Cloud provider user id once an email sign-in has been linked */
  cloudUid?: string;
  createdAt: number;
}

/** A parent-created category for organising custom tiles */
export interface CustomCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  colorDark: string;
}

/** Per-word quiz mastery, persisted in localStorage */
export interface WordStat {
  attempts: number;
  correct: number;
  /** consecutive first-try correct answers; >= 3 counts as mastered */
  streak: number;
}

export type CategoryGroup = 'talk' | 'learn';

export interface Category {
  id: string;
  emoji: string;
  en: string;
  hi: string;
  /** Fitzgerald-key inspired colour for the whole category */
  color: string;
  colorDark: string;
  level: AgeMode;
  /** Which top-level tab the category lives under (defaults to 'talk') */
  group?: CategoryGroup;
  words: Word[];
}

export interface Settings {
  /** App language: the big label on every tile and all UI text */
  language: Language;
  /** Home language shown as the small caption under each tile label */
  motherTongue: Language | null;
  /** Also speak the word in the mother tongue after the app language */
  speakMotherTongue: boolean;
  ageMode: AgeMode;
  speechRate: number;
  /** Show the small second-language caption under each label */
  showBothLanguages: boolean;
  /** Speak each word immediately when its tile is tapped */
  speakOnTap: boolean;
  /** Vibrate briefly on every tap (Android) */
  vibrateOnTap: boolean;
  /** Extra space between tiles for kids who mis-tap */
  roomyGrid: boolean;
  /** Switch-scanning access: tiles highlight in turn, tap anywhere to select */
  scanning: boolean;
  /** First–Then visual schedule: word ids chosen by the caregiver */
  firstThenFirst: string | null;
  firstThenThen: string | null;
  /** Daily YouTube watching budget in minutes */
  videoLimitMins: number;
  /** Tile size override: 0 = follow age mode, else px column width */
  tileSize: 0 | 100 | 130 | 170 | 210;
  /** How far the Numbers category counts, 10…1000 (grown-up or on-screen control) */
  numberLimit: number;
  /** Show "I want …" style frames above the board */
  sentenceStarters: boolean;
  /** Content packs switched on for this child (festivals, doctor, school) */
  enabledPackIds: string[];
  /** Categories switched off for this child — hidden, never deleted */
  hiddenCategoryIds: string[];
  /** Category ids in the order the child sees them; unlisted ones follow */
  categoryOrder: string[];
}

/** One step in the full-day visual schedule */
export interface ScheduleStep {
  id: string;
  wordId: string;
  /** optional clock hint like "8:00" */
  time?: string;
}

/** One spoken sentence, kept in the replay history */
export interface HistoryEntry {
  wordIds: string[];
  ts: number;
}
