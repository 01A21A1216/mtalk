# MTalk — Feature Backlog

Priorities: **P1** = next up · **P2** = strong candidates · **P3** = later

## ✅ Shipped

- v1.0 — Core AAC board: tap-to-speak tiles, sentence strip, quick bar, English + Hindi TTS, age modes (Little/Junior/Senior), Fitzgerald-key categories, Indian vocabulary (~350 words incl. First 100), Learn tab, child-locked settings, PWA offline, signed Android APK
- v1.1 — Custom tiles (photo + recorded voice, "My Words" category), Quiz mode (listen-and-tap, 2/4 choices by age, per-word mastery tracking, progress summary in settings)
- v1.2 — Telugu (తెలుగు) as third language: full translation of all ~350 words + categories + UI strings via id-keyed layer (`src/data/te.ts` + `src/i18n.ts`), te-IN TTS
- v1.3 — Tamil (தமிழ்) + Kannada (ಕನ್ನಡ) full translations; usage insights (local tap log, 28-day window; settings shows words-this-week / new-this-week / top words); auto 💖 Favourites board (12 most-used words with ≥3 taps, appears once 4 words qualify)
- v1.4 — P2/P3 sweep: edit custom tiles (✏️ in settings); quiz spaced repetition (mastered words revisit ~20%); 🕘 sentence history (last 20 spoken sentences, tap to reload into strip); backup/restore to JSON file (settings → Backup; includes custom tiles with photos/voices); vibrate-on-tap toggle; roomy-grid toggle (extra spacing for motor-skill aiming); scanning access mode (tiles highlight in turn, tap anywhere selects — switch-access style)

- v1.7 — ✨ word prediction (bigram learning from the child's own sentences, suggestions row under the strip, needs 2+ observations); 1️⃣➡️2️⃣ First–Then visual schedule (caregiver picks two words in settings, localized banner above the strip, tap to speak); SVG food art for paratha + samosa; tap-to-open settings (math gate is the child lock); quick bar centered above content

- v1.8 — Preschool learning pack: 🔤 ABC category (A–Z, "A for Apple" speech), 🧸 Preschool category (story time, circle time, cutting/pasting, line up, my turn…), 🎨 Art category (paint, brush, finger paint, clay…), and a new ✍️ Write tab — letter tracing over a big ghost letter + free painting with 7 colours (canvas, works with finger on touch screens); all new words translated in 5 languages

- v2.1 — **Grown-up accounts**: login before the board (PIN hashed with PBKDF2, lockout after repeated wrong tries, "stay signed in"), signup for new users, admin/parent roles, app-owner account (`lakshminarayana.kodavati@gmail.com`, always admin, provisioned on any device), optional Firebase email sign-in, help & support, subscription status + entitlement layer (nothing gated); **📊 Progress dashboard** (daily activity, category coverage, most-used words, sentences, quiz, per-child switcher); **📁 Categories manager** (show/hide + reorder per child, expand to view tiles, edit/add tiles in place); tile photos from **camera / gallery / web search (Openverse, keyless) / AI proxy**; **numbers to 1000** with on-board load control; **full alphabets** for Devanagari/Telugu/Tamil/Kannada + a–z; **0–100 number tracing**; story player always opens on slide one and replays from the start

## P1 — next up

### Value programme (agreed Aug 2026)

1. **Cloud backup & restore per child** — automatic backup of tiles, photos, recordings and progress to Firebase Storage; restore on a new tablet by signing in. *Losing a tablet currently destroys a child's voice.* **Blocked:** needs the Firebase project on the Blaze plan.
   - Accept: sign in on a fresh device → pick a child → board returns intact; last-backup time shown; per-account isolation in Storage rules; a delete-my-data path.
2. ~~**Parent's voice for core words**~~ — ✅ **done** (v2.3). Settings → 🎙️ Your voice: 44 core words one at a time, record / hear / remove, progress bar, 3-second cap. Clips live in IndexedDB per child (`voices` store, db v3) and are loaded into memory when the board opens, so playback is instant. Speech prefers a recording over TTS everywhere — board, sentence strip, stories. [`src/services/voicePack.ts`](src/services/voicePack.ts), [`src/data/coreWords.ts`](src/data/coreWords.ts)
3. ~~**Coaching tips in the dashboard**~~ — ✅ **done** (v2.2). "What to try next" in 📊 Progress: up to three tips from real usage — +1 modelling on the most-tapped word, an untouched category, new words this week, and a warning when one tile carries >40% of taps. Each tip shows the observation behind it. [`src/services/coaching.ts`](src/services/coaching.ts)
4. ~~**Therapist / school sharing**~~ — ✅ **done** (v2.3). Settings → 🖨️ Print & share → *Summary for therapy or school*: one page, 28 days, words spoken / different / new / days used, most-used words, category coverage, quiz. Carries the child's first name and nothing else identifying. Works offline; no popup window.
5. ~~**Sentence starters**~~ — ✅ **done** (v2.2). Eight frames (I want / I see / I like / I don't like / More / All done / Help me / My turn) in all five languages, above the board. Tap a frame then a tile and the strip holds the phrase. Off by default, per child, in Settings → 💬 Sentence starters. [`src/data/starters.ts`](src/data/starters.ts)
6. ~~**Printable communication book**~~ — ✅ **done** (v2.3). Six big tiles a page with photo or emoji, label and mother-tongue caption, in sections: core words, the child's own tiles, then the words they use most. [`src/components/PrintSheet.tsx`](src/components/PrintSheet.tsx)
7. ~~**Indian content packs**~~ — ✅ **done** (v2.3). Six packs of 8 words each — 🪔 Diwali · 🌾 Pongal · 🌙 Eid · 🩺 Doctor visit · 🛕 Temple · 🏫 School day — switched on per child in Settings → 🎁 Content packs, off by default so the board stays calm. English + Hindi written; te/ta/kn need a native speaker to review (they fall back to English). [`src/data/packs.ts`](src/data/packs.ts)
   - Not gated: packs are free today. `PREMIUM_FEATURES` in `src/config.ts` is where to put the pack ids if they ever become a subscription perk.
8. ~~**OBF import/export**~~ — ✅ **done** (v2.3). Settings → 🔁 Share with other AAC apps. **Export** writes the child's whole board as a `.obz`: a root board of categories, one board per category, emoji drawn to PNG so the pictures survive in an app that has never heard of MTalk (~1.2 MB for the full 445-word board). **Import** reads `.obf` or `.obz` — stored or deflated, inline `data:` or in-zip `path` pictures — and lands each board as a 📥 custom category of ordinary tiles the parent can edit or delete. Zip is written and read in-house; no dependency. [`src/services/obf.ts`](src/services/obf.ts)
   - Carried across: labels, `vocalization` (kept on the tile as its spoken text), board names, colours. Reported but not carried: recorded button sounds, and pictures that are web links rather than files.
   - Verified both ways against a foreign board written by PowerShell, and by extracting our own export with Windows' unzip.

9. ~~**🎵 Music room**~~ — ✅ **done** (v2.2). Piano (2 octaves, sargam labels), guitar (6 strings + 6 chords), drum kit (6 pads), tabla (Na/Tin/Te, Ge/Ka, Dha). Every sound synthesised on device with the Web Audio API — no samples, works offline, loads only when the tab is opened. [`src/services/audioEngine.ts`](src/services/audioEngine.ts)
   - ✅ **Rhythm follow-ups done** (v2.2): record & play back a performance on any instrument; taal loop with tempo (Keherwa, Dadra, Teental, Rupak) showing sam and khali, which doubles as play-along; and a "Copy me" game that plays 3–4 bols for the child to repeat on the tabla. [`src/services/rhythm.ts`](src/services/rhythm.ts), [`src/data/taals.ts`](src/data/taals.ts)
   - ✅ **Wordless lessons** (v2.2): eight short sessions across piano, xylophone, tabla and drums. The app plays a note and makes that exact control glow; the child copies. No instruction to read, no answer to say, no score and no way to fail — a wrong tap just replays the target. [`src/data/lessons.ts`](src/data/lessons.ts)
   - Still later: save a recording to a child's board so it can be replayed another day; lessons for guitar and the drum pads.

### Carried over

- ~~**Marathi, Bengali**~~ — ✅ **done** (v2.3). मराठी and বাংলা as the sixth and seventh languages: all 409 words + 32 categories + the First-100 section headings + every UI string + the eight sentence starters, with `mr-IN` / `bn-IN` speech. [`src/data/mr.ts`](src/data/mr.ts), [`src/data/bn.ts`](src/data/bn.ts)
   - Both were written to match the register the other languages use — a child's imperative, not the dictionary form. A native speaker should still read them before they go to families.
   - Speech needs the tablet to have the Marathi/Bengali TTS voice installed; without it the label still shows and the device falls back to its default voice.

## P2 — strong candidates

- **ARASAAC pictograms** — therapy-standard open-licensed symbols to replace emoji for abstract words (want, more, later); needs an offline symbol pack + attribution (CC BY-NC-SA licensing)
- **Reverse quiz** — see picture → hear 3 words, pick the right one; weekly progress chart
- **Custom tile category assignment + reordering**

- v1.9 (web) — Stories & Rhymes picture-book player (16 titles, per-line emoji scenes, en+hi); multi-child **profiles** (picker screen, per-profile settings/tiles/progress/favorites, auto-migration of existing data); **custom categories** for tiles; **🏠 Home tab** (pinned words + favourites + custom tiles per child); Kid Lock (native, next APK); HTTPS server for tablet mic; Write tab trace categories in sidebar

- v1.10 (web) — 🎬 YouTube reward videos (per-profile playlist with thumbnails, kid-proof shielded player with controls/keyboard/fullscreen disabled, daily minute budget with visual countdown + spoken 1-minute warning + lock screen, parent reset, auto daily reset); Write tab trace sets (letters/numbers/shapes/symbols/animals/cartoons) in left sidebar; tile layout hardened with container-relative sizing (no overflow at any screen/zoom)

- v2.0 — Full-day visual schedule (Home tab strip, per-step ticks that clear overnight, current-step highlight, parent editor with reorder); calm-corner breathing bubble (4-4-6, spoken, 5 languages); choice mode (two big tiles); native-script tracing (Devanagari/Telugu/Tamil/Kannada) in Write; per-child tile size; animal/vehicle sound effects; shareable progress report; social stories builder; sentence share-as-image; GitHub Pages hosting

## P3 — later
- **Scanning speed setting + row/column scanning** — current scanning is linear at fixed 1.8 s
- **Backup improvements** — in-APK file save needs a Capacitor Filesystem plugin (browser/PWA download works today)
- **Play Store / App Store publishing** — AAB build, store listing, privacy policy; iOS build needs a Mac
