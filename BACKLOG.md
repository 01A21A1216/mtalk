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

### 🧩 Thinking games (researched Aug 2026, not started)

**Not "Brain Gym®".** The branded programme (Dennison's Educational Kinesiology — "brain buttons", cross-crawl, hemispheric integration) has no credible evidence behind it and is a standard example of classroom pseudoscience. Its claims must not go into an app sold to families of disabled children. The *want* behind the request is real, so this item builds the real thing under a plain name.

**What the games may honestly claim.** Cognitive-training meta-analyses find solid *near* transfer (you get better at the trained task, g ≈ 0.44) and essentially no *far* transfer to intelligence or school results (g ≈ 0.11, shrinking further in well-controlled studies). So the promise is "practice at looking, matching and remembering", never "a smarter child".

**The AAC rule that shapes the design.** The field is explicit that there are *no prerequisite skills* for AAC — children have been denied a voice for years while being drilled on cause-and-effect first. So: the games are never a gate. Nothing in Talk unlocks by playing, no score is shown to the child, and the board is always one tap away.

**The design decision that makes it worth building:** the games play with *this child's own tiles* — their photos, their words, their categories. Practising the very symbols they communicate with is the one place near transfer actually counts.

**First two shipped (v2.5)** under the 🎯 Play tab, as chips beside the original listen-and-tap quiz. They play with whatever category is selected above them, so picking *My Words* or a custom category means the child practises their own photos. [`src/components/PlayGames.tsx`](src/components/PlayGames.tsx)

- 🔍 **Find it** — the target sits above a grid the child searches. Grows 2 → 4 → 6 → 9 → 12 after three clean rounds and quietly shrinks again after three misses. Wordless: nothing to hear or read, so a child who does not yet map spoken words can still play. On success it speaks the word itself rather than "well done" — the picture is the lesson.
- 🧩 **Pairs** — turn-over memory, 2 → 3 → 4 → 6 pairs, levelling up each time the board is cleared.

Both dedupe by picture, because several words share an emoji (`yes` and `f-yes` are both 👍) and two identical pictures would mean two right-looking answers with one accepted.

**Not yet:** these do not work under scanning mode — the existing quiz does not either, and switch access across all of Play deserves doing once, properly. Progress is stored per child (`mtalk-games:<id>`: rounds and hardest level) but is not yet surfaced in 📊 Progress.

**All six games now shipped** (v2.7) — 👆 Touch · 🔊 Listen · 🔍 Find it · 🧩 Pairs · 🙅 Odd one · 🔢 How many · 🗓️ My day:

1. ~~**Touch anything**~~ — ✅ one enormous target, a new colour and a new word on every tap, and nothing that can be wrong. For a child who has not yet learned that they make things happen; also the gentlest way into switch use, since there is only one thing on screen to wait for.
2. ~~**Odd one out**~~ — ✅ see item 8 above.
3. ~~**What comes next**~~ — ✅ 🗓️ **My day**: the steps of the child's *own* day plan, jumbled, to be put back. The sequence being learned is the one they actually live.
4. ~~**Scanning across the Play tab**~~ — ✅ the lit cell walks the grid every 1.8s and a tap anywhere takes it, matching the board. Without it the Play tab quietly excluded the children with the least movement. **Not yet on 🔊 Listen** (the original quiz) or on 🧩 Pairs, where "the lit card" needs thinking about for a two-tap game.
5. ~~**A line in 📊 Progress**~~ — ✅ rounds finished and hardest level reached, per game. No score and no accuracy, on purpose.

Accessibility rules for all of them: no timer, no failure state (a wrong tap re-shows the right answer and moves on), works under scanning mode, instructions demonstrated rather than written, difficulty per child, and progress reported only to the grown-up in 📊 Progress.

Open question: whether this is a seventh tab (🧩) or a section inside Learn. Six tabs is already a lot for a small child to parse.

### 📚 Learning content for non-verbal kids (researched Aug 2026)

**What the count says.** The board holds 409 words: 100 in First 100, about 33 core words elsewhere, and ~276 nouns across 17 noun categories (Animals 20, Food 19, Vehicles 17, Clothes 13, Vegetables 12, Fruits 12, Sports 12, Birds 12…). Roughly 80% of what anyone says comes from a few hundred *core* words — want, more, stop, go, again, that, my, not. Nouns are fringe: thousands of them, each used rarely. The board is currently inverted against how talking works. A child with twenty animals and no *again* can name a giraffe but cannot ask for the fun thing twice.

So the next content is **depth on the words a child uses fifty times a day**, not another two hundred nouns.

1. ~~**Two-word combinations**~~ — ✅ **done** (v2.6). The hard jump in AAC is not the first word, it is the second. Taught patterns (want + thing, more + action, my + thing, go + place, person + action) so a two-word phrase is one tap away. Feeds the existing ✨ suggestion row, which today only lights up once the child has produced sentences — a cold start a child who cannot yet combine will never escape on their own. Learned pairs still come first; taught ones fill the rest of the row, and any partner already in the strip or missing from this child's board is dropped. Added the word **again** (🔁) with all seven translations — the thing a child asks for most and had no way to say. [`src/data/combos.ts`](src/data/combos.ts)
2. ~~**Word of the week, for the grown-up**~~ — ✅ **done** (v2.6). One core word a week with five concrete ways to model it during an ordinary day. Aided language modelling is the best-evidenced AAC intervention and the thing parents get least help with. Lives in 📊 Progress, not on the child's board. Twelve words — more, again, stop, want, help, go, all done, mine, look, too loud, pain, my turn — each with why it matters and five ordinary moments to use it in. Moves with the calendar so a parent who never touches it still gets a new word, with arrows to wander. English and Hindi written; te/ta/kn/mr/bn fall back to English. [`src/data/coreWeek.ts`](src/data/coreWeek.ts)
3. ~~**Life-skill step sequences**~~ — ✅ **done** (v2.6). A 🧼 **How to** category in Learn: washing hands, brushing teeth, toilet, getting dressed, eating, bath, bedtime, getting ready for school — eight steps each, one action to a page, said to the child rather than about them. They ride the story player, because a routine *is* a picture book about something the child is about to do. [`src/data/routines.ts`](src/data/routines.ts)
   - The player now reads a routine **one step at a time and waits**. Stories still read themselves through — but a book that races ahead to "all clean" while the child is still finding the soap is worse than no book.
   - English and Hindi written; other languages fall back to English.
4. ~~**About me / if I'm lost**~~ — ✅ **done** (v2.6). Settings → 🪪 **About me**: what people call them, full name, parent and second phone, home, school, medical, how they talk, what calms them. Prints as a card whose first line is *"I do not speak. I use a tablet app called MTalk to talk. Please be patient and give me time — I understand more than I can say."* Blank fields are left off the card entirely. [`src/hooks/useAboutMe.ts`](src/hooks/useAboutMe.ts)
   - **Stays on the tablet.** A child's address and their parents' phone numbers are never published to the online account directory. The print button only appears once there is something worth printing.
5. ~~**Feelings and body signals**~~ — ✅ **done** (v2.7). A 🩺 **My body tells me** category in Talk: dizzy · itchy · I want to vomit · my heart is fast · I cannot breathe well · too bright · too tight · I am wet · I want to be alone. All seven languages. The "what helps me" half lives in 🪪 About me, where a new carer will actually look for it.
   - `shivering` was cut: `cold` already says it, and its 🥶 clashed with that tile — two identical pictures would have made it invisible to the games.
6. ~~**Early literacy for AAC users**~~ — ✅ **done** (v2.8), designed per script rather than translated. 🔤 **First letter** in Play: one letter from *this child's own alphabet*, and the words on their board to pick from.

   **Why one game can serve seven languages.** The unit a child learns first is not the same everywhere: English is alphabetic and B is a sound, while Devanagari, Bengali, Telugu, Kannada and Tamil are abugidas where क is already "ka" and the vowel signs that change it (कि, की, कु) hang off that same consonant. What is shared is the *shape of the question* — here is one unit of the script, which of these words begins with it — so the unit is taken from each language's own alphabet in its own teaching order, and the game is native everywhere instead of English with translated labels.

   The matching rule falls out of how the scripts are encoded: vowel signs and virama are combining marks that follow their base, so the first code point of a word is its base letter in all of them. Conjuncts reduce to their first consonant, which is what a child working through the alphabet has been taught to look for. [`src/services/scriptLetters.ts`](src/services/scriptLetters.ts)

   Coverage across the whole board — letters that have a word behind them: **en 26/26 · mr 36/50 · hi 35/49 · bn 34/47 · kn 34/49 · te 32/52 · ta 26/36**. Only letters the child's board can answer are ever asked about.

   Verified in three scripts: English (six rounds, always exactly one correct answer), Telugu (क-equivalent క accepted the conjunct క్షమించండి), Hindi (त → ताली, च → चिपकाना, स → सोने — matra words matched to their base consonant).

   - **Bonus fix:** Marathi and Bengali had no native-script tracing in the ✍️ Write tab — a gap opened when those languages were added. Both now have their alphabets (मराठी 50 glyphs including ळ, which Hindi does not use; বাংলা 47), so the Write tab and this game share one source.
   - Still to come: letter-to-sound blending and sight words. This is the first rung of the ladder, not the whole ladder.
7. ~~**Number sense rather than number names**~~ — ✅ **done** (v2.7). 🔢 **How many** in Play: a handful of one picture, and the numerals to match. Grows 1–3 → 1–5 → 1–8 → 1–10. Says the number in the child's own language using the existing number words. More/less and "give me three" are still to come.
8. ~~**Sorting by attribute**~~ — ✅ **done** (v2.7), as 🙅 **Odd one** in Play: three pictures from one of the child's categories and one from another. Categorisation using the way their own board is organised. Says so plainly when there are not two usable categories rather than showing an empty screen.
9. ~~**Community signs, Indian context**~~ — ✅ **done** (v2.7). A 🚻 **Signs** category in Learn: toilet · men · women · drinking water · danger · chemist · police · bus stop · railway station · lift · children crossing · no smoking · first aid. All seven languages.
10. ~~**Social scripts**~~ — ✅ **done** (v2.7). A 👋 **What happens** category in Learn: a visitor arriving · being asked my name · going to the shop · going to the doctor · getting a haircut. Read beforehand, they turn an ambush into something expected, and each one ends by naming the way out — the word the child can press if it becomes too much.
   - Written honestly. "It can feel itchy" is more use than "it will be fun", because when it *is* itchy the book has not lied to them.
   - English and Hindi; other languages fall back to English.

**Flagged, not to be written unilaterally: body autonomy and safe/unsafe touch.** Non-verbal children are abused at far higher rates and are least able to report it, so this content matters enormously — and for that exact reason every tile needs a child-protection specialist's review before it ships.

## P2 — strong candidates

- **ARASAAC pictograms** — therapy-standard symbols for abstract words (want, more, later), which emoji genuinely do badly. **Check the licence before building anything:** ARASAAC is CC BY-NC-SA — the NC is non-commercial, and MTalk has a subscription. Shipping the pack inside a paid app would need either a licence conversation with ARASAAC or a decision that the symbols only ever ride along with the free side of the app. That is a question for a person, not something to sort out in code.
- **Reverse quiz** — see picture → hear 3 words, pick the right one; weekly progress chart
- ~~**Custom tile category assignment + reordering**~~ — ✅ **done** (v2.8). Assignment already existed in the tile editor; the missing half was order — tiles were stuck in the sequence they happened to be made in. ◀ ▶ on every tile in 📁 Categories now sets the order a child reads them in.
  - The tiles keep the numeric slots they already had and swap which tile holds which, so a tile that has never been moved still sorts by when it was made and no tile can drift into another category's range. Verified: Alpha·Bravo·Charlie → Charlie·Alpha·Bravo, persisted as `order` 1000/1001/1002, and the child's board shows the chosen order.

- v1.9 (web) — Stories & Rhymes picture-book player (16 titles, per-line emoji scenes, en+hi); multi-child **profiles** (picker screen, per-profile settings/tiles/progress/favorites, auto-migration of existing data); **custom categories** for tiles; **🏠 Home tab** (pinned words + favourites + custom tiles per child); Kid Lock (native, next APK); HTTPS server for tablet mic; Write tab trace categories in sidebar

- v1.10 (web) — 🎬 YouTube reward videos (per-profile playlist with thumbnails, kid-proof shielded player with controls/keyboard/fullscreen disabled, daily minute budget with visual countdown + spoken 1-minute warning + lock screen, parent reset, auto daily reset); Write tab trace sets (letters/numbers/shapes/symbols/animals/cartoons) in left sidebar; tile layout hardened with container-relative sizing (no overflow at any screen/zoom)

- v2.0 — Full-day visual schedule (Home tab strip, per-step ticks that clear overnight, current-step highlight, parent editor with reorder); calm-corner breathing bubble (4-4-6, spoken, 5 languages); choice mode (two big tiles); native-script tracing (Devanagari/Telugu/Tamil/Kannada) in Write; per-child tile size; animal/vehicle sound effects; shareable progress report; social stories builder; sentence share-as-image; GitHub Pages hosting

## P3 — later
- ~~**Scanning speed setting**~~ — ✅ **done** (v2.8). Five speeds from 🐢 3.5 s to 🐇 0.8 s, shown only when scanning is on, applied to the board *and* to every game in Play. The right speed is personal and the wrong one makes the mode useless — too fast and a child never lands on what they meant, too slow and a sentence takes a minute. Verified end to end: picking 🐢 stored 3500 and the board's highlight stepped at that pace.
  - **Row/column scanning still to do** — with a big board, stepping one tile at a time is slow however well the speed is set. Rows first, then tiles within the chosen row, is the standard answer.
- **Backup improvements** — in-APK file save needs a Capacitor Filesystem plugin (browser/PWA download works today)
- **Play Store / App Store publishing** — AAB build, store listing, privacy policy; iOS build needs a Mac
