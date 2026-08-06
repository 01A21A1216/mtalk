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
- **🗓️ Day plan** — the child's full routine on the Home tab; they tick each step as it's done, ticks clear every morning
- **🫧 Calm corner** — a breathing bubble with spoken 4-4-6 prompts for meltdowns, one tap from the header
- **✌️ Choice mode** — show only two big tiles ("roti or rice?") to start communication
- **🔊 Sound effects** — animals say their sounds, vehicles honk/siren/ring, in the child's language
- **📄 Progress report** — one tap shares a stats card (words this week, mastery, top words) for therapist visits
- **✍️ Write & Paint tab** — trace English letters, numbers, shapes, symbols, animals, cartoons, **and native scripts** (अ आ इ / అ ఆ ఇ / அ ஆ இ / ಅ ಆ ಇ), or free-paint with 7 colours
- **🎬 Reward videos** — parents add YouTube links; kid-proof player (no controls, no seeking, can't reach YouTube) with a visual daily time budget, spoken one-minute warning, lock screen when time is up, and parent reset
- **📁 Custom categories** — organise custom tiles into parent-created categories
- **🔒 Kid lock** (installed app) — pins MTalk to the screen so the child can't leave; unlock via gated settings
- **Child-locked settings** — tap the gear, answer a simple sum; caregivers manage kids, languages, age modes, speech, videos, home tiles, and more
- **Fully offline** — no network needed; speech uses on-device voices

## Grown-up accounts (login)

MTalk asks a grown-up to sign in before the board appears. A fresh install opens on **"Welcome — set up this tablet"**, where the parent creates their own account (name + 4–6 digit PIN); after that it is the account picker and keypad.

**App owner.** `lakshminarayana.kodavati@gmail.com` is the owner account — support, subscriptions and every install ([`src/config.ts`](src/config.ts)). An account with that email is always an admin, cannot be demoted or deleted on any device, and is badged 👑 in Settings → Accounts. With cloud sign-in configured, the owner signing in on a tablet that has no such account is provisioned an admin account there automatically, which is what makes remote support possible. Everyone sees **❓ Need help?** on the login screen and **Help & support** in Settings; both open a pre-filled mail to that address with the app version and device.

Roles on a device:

| | Owner 👑 / Admin 🛡️ | Parent 👪 |
|---|---|---|
| Children they see | all | only the ones assigned to them |
| Kids (add/remove) | ✅ | — |
| Accounts (add/remove, reset PINs, change roles) | ✅ | — |
| Backup / restore | ✅ | — |
| Kid lock | ✅ | — |
| Language, age mode, tiles, home board, stories, videos, day plan, quiz, insights | ✅ | ✅ (their child only) |
| Own PIN | ✅ | ✅ |

- **PINs are hashed** with PBKDF2-SHA256 (120k rounds, per-account salt) and only the hash is stored. On a page served over plain http, `crypto.subtle` is unavailable, so a weaker fallback is used and the record is upgraded automatically at the next sign-in from a secure context.
- **"Stay signed in on this tablet"** is on by default so a restart does not leave a non-verbal child waiting for a grown-up. Turning it off ends the session when the app closes. Sign out lives in Settings → footer.
- Six wrong PINs start a growing lockout (15s, 30s, 60s … capped at 5 minutes).
- The arithmetic gate on ⚙️ Settings is unchanged — it stops the *child* wandering in while the grown-up is signed in.
- Accounts are per-device and are **not** included in backup files.

### Tile pictures

Every parent-made tile needs a picture. The editor offers four ways to get one ([`src/services/imageSources.ts`](src/services/imageSources.ts)):

| | How it works |
|---|---|
| 📸 Camera | A file input with `capture="environment"`, so Android opens the camera app directly — no extra permission needed inside the WebView |
| 🖼️ Gallery | The existing photo picker |
| 🔍 Search web | [Openverse](https://openverse.org) — Creative Commons images, **no API key or account**. Its thumbnail endpoint sends CORS headers, so a picked image is cropped square and stored as a data URL. The licence is shown on every result |
| ✨ Make one | Generates a picture from the tile's name and category. Hidden unless `VITE_IMAGE_GEN_URL` is set |

A real photo of the child's own bottle beats any stock image, so the camera stays first. Search and AI are for what you can't photograph — "aeroplane", "doctor", "angry".

**On the AI option:** the app posts to an endpoint *you* host, never straight to an image provider. A provider key shipped inside an APK can be extracted and spent by whoever finds it, so the key belongs server-side in a Cloud Function that this URL points at.

### Subscriptions

Parents pay on a web page you host (Razorpay/Stripe) — never inside the app, which keeps Google Play and Apple's payment rules out of the picture. The flow is: payment page → your webhook → a `subscriptions/{cloudUid}` document in Firestore → the app reads it at email sign-in and caches the answer on the device ([`src/services/subscription.ts`](src/services/subscription.ts)).

- Settings → 💳 Subscription shows the plan for the signed-in account. Set `VITE_SUBSCRIBE_URL` and it also shows a **Manage subscription** link; with no URL it says so instead.
- **Nothing is gated yet.** `PREMIUM_FEATURES` in [`src/config.ts`](src/config.ts) is empty on purpose — the board, tiles and speech must never depend on a payment, so put only genuinely optional extras there. `isLocked(featureId, entitlement)` is ready when you decide.
- Until the webhook exists, the owner can grant or revoke a year on a device by hand from that section.
- A failed or offline entitlement check never downgrades an account — the cached record stands.

### Optional cloud sign-in

Copy `.env.example` to `.env` and add a Firebase Web API key to also offer email + password sign-in (Firebase Authentication, called over its REST API — no extra dependency):

```bash
VITE_FIREBASE_API_KEY=AIza...
```

Enable Authentication → Sign-in method → Email/Password in the Firebase console. A cloud sign-in is matched to an account on the tablet **by email**, so the admin must first add that email in Settings → Accounts. PIN sign-in keeps working with no internet — an AAC device has to work with the WiFi off.

Relevant files: [`src/services/auth.ts`](src/services/auth.ts), [`src/services/authCloud.ts`](src/services/authCloud.ts), [`src/hooks/useAuth.ts`](src/hooks/useAuth.ts), [`src/components/LoginScreen.tsx`](src/components/LoginScreen.tsx), [`src/components/AccountsSection.tsx`](src/components/AccountsSection.tsx).

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
