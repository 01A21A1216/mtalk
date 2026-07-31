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

## P1 — next up

- **Marathi, Bengali** — same translation-layer pattern (one data file + i18n entry + settings button each)
- **Write tab: Devanagari/Telugu/Tamil/Kannada letters** — trace अ आ इ / అ ఆ ఇ etc. when a non-English language is active
- **Write tab: numbers tracing (1–10)** and shape tracing for pre-writing skills

## P2 — strong candidates

- **ARASAAC pictograms** — therapy-standard open-licensed symbols to replace emoji for abstract words (want, more, later); needs an offline symbol pack + attribution (CC BY-NC-SA licensing)
- **Reverse quiz** — see picture → hear 3 words, pick the right one; weekly progress chart
- **Custom tile category assignment + reordering**

- v1.9 (web) — Stories & Rhymes picture-book player (16 titles, per-line emoji scenes, en+hi); multi-child **profiles** (picker screen, per-profile settings/tiles/progress/favorites, auto-migration of existing data); **custom categories** for tiles; **🏠 Home tab** (pinned words + favourites + custom tiles per child); Kid Lock (native, next APK); HTTPS server for tablet mic; Write tab trace categories in sidebar

- v1.10 (web) — 🎬 YouTube reward videos (per-profile playlist with thumbnails, kid-proof shielded player with controls/keyboard/fullscreen disabled, daily minute budget with visual countdown + spoken 1-minute warning + lock screen, parent reset, auto daily reset); Write tab trace sets (letters/numbers/shapes/symbols/animals/cartoons) in left sidebar; tile layout hardened with container-relative sizing (no overflow at any screen/zoom)

## P3 — later
- **Scanning speed setting + row/column scanning** — current scanning is linear at fixed 1.8 s
- **Backup improvements** — in-APK file save needs a Capacitor Filesystem plugin (browser/PWA download works today)
- **Play Store / App Store publishing** — AAB build, store listing, privacy policy; iOS build needs a Mac
