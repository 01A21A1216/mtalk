# MTalk — My Voice 🗣️

An AAC (Augmentative and Alternative Communication) app for non-verbal special-needs kids in India, ages 1–15. Kids tap colourful picture tiles to speak words and build sentences, with English and Hindi text-to-speech.

Built as a hybrid app: **Vite + React + TypeScript** web core wrapped with **Capacitor** for Android/iOS tablets.

## Features

- **Tap-to-speak tiles** — every tile speaks its word aloud using the device's Indian English (`en-IN`) or Hindi (`hi-IN`) voice
- **Sentence strip** — kids chain tiles into sentences ("I want" + "water") and play them with the big 🔊 button, followed by a star celebration
- **Quick bar** — Yes / No / More / Stop / Help / Toilet always one tap away
- **Indian-context vocabulary** — Amma, Appa, Bhaiya, Didi, roti, dal, idli, dosa, cricket, temple, tiffin, and more, in English, Hindi (हिन्दी), Telugu (తెలుగు), Tamil (தமிழ்) and Kannada (ಕನ್ನಡ); new languages are added as id-keyed translation files (see `src/data/te.ts` + `src/i18n.ts`)
- **Auto Favourites board (💖)** — the child's 12 most-used words become the first category automatically
- **Talking insights** — settings shows words used this week, new words, and most-used words (all tracked locally, 28-day window)
- **Age modes** — Little (1–4: few huge tiles), Junior (5–9), Senior (10–15: full board including School category)
- **Fitzgerald-key colours** — categories follow AAC colour conventions (people = yellow, actions = green, needs = red, feelings = blue…)
- **Custom tiles (⭐ My Words)** — parents add tiles with a real photo (camera/gallery) and an optional recorded voice; stored on-device in IndexedDB. Managed from Settings → My tiles. Recorded voices play in sentences too.
- **Quiz mode (🎯)** — listen-and-tap practice: the app asks "Where is the elephant?", the child picks from 2 (Little mode) or 4 pictures; wrong answers shake and get a gentle retry, right answers earn stars with a celebration every 5. Per-word mastery (3 first-try correct = mastered) is tracked and summarised in Settings → Quiz progress.
- **✨ Word prediction** — the app learns which word the child usually taps next and offers one-tap suggestions under the sentence strip (all learning stays on-device)
- **1️⃣➡️2️⃣ First–Then schedule** — caregivers set "First homework, then TV" in settings; the child sees and can tap-to-hear both steps
- **Sentence history (🕘)** — the last 20 spoken sentences; tap one to say it again
- **Scanning access mode** — for kids with motor impairments: tiles light up one at a time and a tap anywhere selects the highlighted one (enable in settings)
- **Backup / restore** — export everything (settings, custom tiles with photos and voices, progress, usage) to a JSON file and restore it on another device (settings → Backup; works in browser/PWA)
- **👨‍👩‍👧 Kid profiles** — "Who is talking today?" picker; every child gets isolated settings, tiles, progress, favourites, and home board
- **🏠 Home tab** — each child's personal board: parent-pinned words + auto favourites + custom tiles
- **📖 Stories & 🎵 Rhymes** — 16 read-aloud picture books (emoji scene per line, line highlighting, page arrows) in English + Hindi
- **✍️ Write & Paint tab** — trace letters, numbers, shapes, symbols, animals, and cartoons, or free-paint with 7 colours
- **🎬 Reward videos** — parents add YouTube links; kid-proof player (no controls, no seeking, can't reach YouTube) with a visual daily time budget, spoken one-minute warning, lock screen when time is up, and parent reset
- **📁 Custom categories** — organise custom tiles into parent-created categories
- **🔒 Kid lock** (installed app) — pins MTalk to the screen so the child can't leave; unlock via gated settings
- **Child-locked settings** — tap the gear, answer a simple sum; caregivers manage kids, languages, age modes, speech, videos, home tiles, and more
- **Fully offline** — no network needed; speech uses on-device voices

## Development

```bash
npm install
npm run dev        # local dev server at http://localhost:5173
npm run build      # type-check + production build to dist/
```

## Android tablet build (signed APK)

Toolchain on this machine: JDK 21 (`C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot`) and Android SDK (`C:\Android\sdk`, set in `android/local.properties`).

```bash
npm run build
npx cap sync android
cd android && gradlew.bat assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk` — copy to any Android device and open it to install (enable "Install unknown apps" for the file manager when prompted).

Release signing uses `android/mtalk-release.keystore` with credentials in `android/keystore.properties`. **Back both files up and keep them private** — updates must be signed with the same key, and neither file should ever be committed to a public repo.

App ID: `com.mxailabs.mtalk`.

## iPad / iOS build

The `ios/` project is ready, but Apple only allows iOS compilation on macOS with Xcode:

```bash
npx cap open ios   # on a Mac
```

Then sign with an Apple Developer account and run on the iPad. Without a Mac, use the PWA route: open the app URL in Safari on the iPad → Share → Add to Home Screen (works offline after first load).

## Project layout

- `src/data/vocabulary.ts` — all categories and words (edit here to add vocabulary; each word has `en`, `hi`, an emoji, and an age `level`)
- `src/services/speech.ts` — text-to-speech + tap sound feedback
- `src/components/` — Tile, CategoryBar, SentenceStrip, QuickBar, SettingsModal
- `src/hooks/useSettings.ts` — persisted caregiver settings (localStorage)
