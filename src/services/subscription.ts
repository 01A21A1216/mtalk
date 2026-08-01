import { PREMIUM_FEATURES } from '../config';

/**
 * Subscription entitlement.
 *
 * Money never changes hands inside the app: parents pay on a web page, a
 * webhook writes the result to Firestore (`subscriptions/{cloudUid}`), and the
 * app *reads* that record when the owner or parent signs in with email. The
 * answer is cached on the device so an expired card can never take a child's
 * board away while they are offline.
 */

const KEY = 'mtalk-subscriptions';

export type PlanId = 'free' | 'premium';

export interface Entitlement {
  plan: PlanId;
  /** Epoch ms; null means it does not expire (e.g. a granted account) */
  expiresAt: number | null;
  /** Where this record came from, for support questions */
  source: 'cloud' | 'granted' | 'none';
  /** When the device last heard from the cloud */
  checkedAt: number;
}

export const FREE: Entitlement = {
  plan: 'free',
  expiresAt: null,
  source: 'none',
  checkedAt: 0,
};

type Store = Record<string, Entitlement>;

function load(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Store;
  } catch {
    return {};
  }
}

export function entitlementFor(userId: string): Entitlement {
  return load()[userId] ?? FREE;
}

export function saveEntitlement(userId: string, value: Entitlement) {
  try {
    const store = load();
    store[userId] = value;
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // best-effort, same as the rest of the app's storage
  }
}

export const isActive = (e: Entitlement) =>
  e.plan !== 'free' && (e.expiresAt == null || e.expiresAt > Date.now());

/** True when a feature is behind the paywall *and* the account has not paid */
export const isLocked = (featureId: string, e: Entitlement) =>
  PREMIUM_FEATURES.includes(featureId) && !isActive(e);

export function describe(e: Entitlement): string {
  if (!isActive(e)) return e.plan === 'free' ? 'Free' : 'Expired';
  if (e.expiresAt == null) return 'Premium — no expiry';
  return `Premium — renews ${new Date(e.expiresAt).toLocaleDateString()}`;
}

/**
 * Reads `subscriptions/{uid}` from Firestore with the id token from a fresh
 * cloud sign-in. Any failure (offline, no project configured, no such
 * document) leaves the cached entitlement untouched — never downgrades.
 */
export async function fetchEntitlement(
  cloudUid: string,
  idToken: string,
): Promise<Entitlement | null> {
  const project = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  if (!project) return null;
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/subscriptions/${cloudUid}`,
      { headers: { Authorization: `Bearer ${idToken}` } },
    );
    if (!res.ok) return null;
    const doc = (await res.json()) as {
      fields?: {
        plan?: { stringValue?: string };
        expiresAt?: { timestampValue?: string; integerValue?: string };
      };
    };
    const plan = doc.fields?.plan?.stringValue === 'premium' ? 'premium' : 'free';
    const stamp = doc.fields?.expiresAt;
    const expiresAt = stamp?.timestampValue
      ? Date.parse(stamp.timestampValue)
      : stamp?.integerValue
        ? Number(stamp.integerValue)
        : null;
    return { plan, expiresAt, source: 'cloud', checkedAt: Date.now() };
  } catch {
    return null;
  }
}
