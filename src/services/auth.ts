import { isOwnerEmail } from '../config';
import type { AppUser, PinAlgo, UserRole } from '../types';

/**
 * Grown-up accounts for MTalk.
 *
 * The app is offline-first, so accounts live on the device: a PIN is hashed
 * with PBKDF2-SHA256 (WebCrypto) and only the hash is stored. An optional
 * cloud account (see authCloud.ts) can be linked to a local account by email
 * so the same person can sign in on a new tablet — the PIN still works with
 * no network, which is what matters when a child needs their voice.
 *
 * Threat model: this keeps the child, and casual hands, out of caregiver
 * settings and other children's data. It is not disk encryption — anyone with
 * the unlocked tablet and developer tools can read localStorage.
 */

const USERS_KEY = 'mtalk-users';
const SESSION_KEY = 'mtalk-session';
const PBKDF2_ROUNDS = 120_000;
const WEAK_ROUNDS = 20_000;

/** PBKDF2 needs crypto.subtle, which browsers only expose in a secure context */
export const strongHashAvailable = () =>
  typeof crypto !== 'undefined' && !!crypto.subtle;

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

/**
 * Fallback for plain-HTTP contexts (a LAN preview without a trusted
 * certificate), where crypto.subtle is undefined. Iterated FNV-1a is far
 * weaker than PBKDF2 — records made this way are marked 'weak' and get
 * re-hashed on the next successful sign-in from a secure context.
 */
function weakHash(pin: string, salt: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const input = `${salt}:${pin}`;
  for (let round = 0; round < WEAK_ROUNDS; round++) {
    for (let i = 0; i < input.length; i++) {
      h1 ^= input.charCodeAt(i) + round;
      h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ h1, 0x85ebca6b) >>> 0;
    }
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export async function hashPin(
  pin: string,
  salt: string,
): Promise<{ hash: string; algo: PinAlgo }> {
  if (!strongHashAvailable()) {
    return { hash: weakHash(pin, salt), algo: 'weak' };
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: PBKDF2_ROUNDS, hash: 'SHA-256' },
    key,
    256,
  );
  return { hash: toHex(new Uint8Array(bits)), algo: 'pbkdf2' };
}

async function hashWith(pin: string, salt: string, algo: PinAlgo): Promise<string> {
  if (algo === 'weak') return weakHash(pin, salt);
  const { hash } = await hashPin(pin, salt);
  return hash;
}

// ---------------------------------------------------------------- user store

export function loadUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = raw ? (JSON.parse(raw) as AppUser[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUsers(users: AppUser[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // best-effort persistence, same as the rest of the app
  }
}

export const adminCount = (users: AppUser[]) =>
  users.filter((u) => u.role === 'admin').length;

export interface NewUserInput {
  name: string;
  role: UserRole;
  pin: string;
  /** Required for every new account — it is how the owner and the cloud
   *  identify a grown-up. Existing records from before this rule keep working. */
  email: string;
  kidIds?: string[];
}

export async function makeUser(input: NewUserInput): Promise<AppUser> {
  const salt = randomSalt();
  const { hash, algo } = await hashPin(input.pin, salt);
  // The owner is an admin wherever they sign in, whatever the form said
  const role = isOwnerEmail(input.email) ? 'admin' : input.role;
  return {
    id: `u${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    name: input.name.trim() || (role === 'admin' ? 'Admin' : 'Parent'),
    role,
    email: input.email?.trim().toLowerCase() || undefined,
    kidIds: input.kidIds ?? [],
    pinSalt: salt,
    pinHash: hash,
    pinAlgo: algo,
    createdAt: Date.now(),
  };
}

/** Returns the (possibly re-hashed) user on success, null on a wrong PIN */
export async function verifyPin(user: AppUser, pin: string): Promise<AppUser | null> {
  const candidate = await hashWith(pin, user.pinSalt, user.pinAlgo);
  if (candidate !== user.pinHash) return null;
  // Upgrade records hashed in an insecure context once PBKDF2 is available
  if (user.pinAlgo === 'weak' && strongHashAvailable()) {
    const salt = randomSalt();
    const { hash, algo } = await hashPin(pin, salt);
    return { ...user, pinSalt: salt, pinHash: hash, pinAlgo: algo };
  }
  return user;
}

export async function withNewPin(user: AppUser, pin: string): Promise<AppUser> {
  const salt = randomSalt();
  const { hash, algo } = await hashPin(pin, salt);
  return { ...user, pinSalt: salt, pinHash: hash, pinAlgo: algo };
}

/** Loose on purpose — the job is to catch typos, not to police valid addresses */
export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/** The app owner's own account — protected from demotion and deletion */
export const isOwner = (user: AppUser) => isOwnerEmail(user.email);

export const findByEmail = (users: AppUser[], email: string) =>
  users.find((u) => u.email && u.email === email.trim().toLowerCase());

/** Admins see every child; parents only the kids assigned to them */
export const visibleKidIds = (user: AppUser, allIds: string[]) =>
  user.role === 'admin' ? allIds : allIds.filter((id) => user.kidIds.includes(id));

export const canAccessKid = (user: AppUser, kidId: string) =>
  user.role === 'admin' || user.kidIds.includes(kidId);

// ------------------------------------------------------------------- session

/**
 * "Stay signed in" writes to localStorage so a relaunch goes straight to the
 * board — a non-verbal child should not lose their voice because a grown-up
 * is not in the room. Without it the session lives in sessionStorage and dies
 * with the tab/app.
 */
export function saveSession(userId: string, remember: boolean) {
  const payload = JSON.stringify({ userId, ts: Date.now() });
  try {
    sessionStorage.setItem(SESSION_KEY, payload);
    if (remember) localStorage.setItem(SESSION_KEY, payload);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // non-persistent session is an acceptable degradation
  }
}

export function loadSession(): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { userId?: string }).userId ?? null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // nothing to do
  }
}

// --------------------------------------------------------- attempt throttling

const attempts = new Map<string, { count: number; until: number }>();

/** Milliseconds the account is locked out for, 0 when it is free to try */
export function lockoutRemaining(userId: string): number {
  const rec = attempts.get(userId);
  if (!rec) return 0;
  return Math.max(0, rec.until - Date.now());
}

export function noteFailure(userId: string) {
  const rec = attempts.get(userId) ?? { count: 0, until: 0 };
  rec.count += 1;
  // 5 free tries, then back off: 15s, 30s, 60s… capped at 5 minutes
  if (rec.count > 5) {
    const wait = Math.min(15_000 * 2 ** (rec.count - 6), 300_000);
    rec.until = Date.now() + wait;
  }
  attempts.set(userId, rec);
}

export function noteSuccess(userId: string) {
  attempts.delete(userId);
}
