import { OWNER_EMAIL } from '../config';
import type { AppUser } from '../types';

/**
 * The online user directory.
 *
 * Deliberately narrow. A child's board, tiles, photos, recordings and progress
 * stay on the tablet and are never uploaded — that is the privacy promise of
 * this app, and the most sensitive data in it belongs to a disabled child.
 *
 * What goes online is the *account*: who has one, what they may reach, and
 * when the app last ran. That is enough for the owner to support families and
 * see who is using it, and not enough to expose a child.
 *
 * Only accounts that sign in with email appear here. PIN-only accounts never
 * touch the network, which is the correct default for a family tablet.
 */

const project = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
const base = () =>
  `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;

export interface DirectoryEntry {
  uid: string;
  email: string;
  name: string;
  role: string;
  /** how many children on that tablet — a count, never their names */
  children: number;
  appVersion: string;
  lastSeen: string;
}

/** The id token from a cloud sign-in, kept for this session only */
let token: string | null = null;
export const setDirectoryToken = (t: string | null) => {
  token = t;
};
export const hasDirectoryToken = () => !!token;

const toFields = (e: Omit<DirectoryEntry, 'uid'>) => ({
  fields: {
    email: { stringValue: e.email },
    name: { stringValue: e.name },
    role: { stringValue: e.role },
    children: { integerValue: String(e.children) },
    appVersion: { stringValue: e.appVersion },
    lastSeen: { stringValue: e.lastSeen },
  },
});

const fromDoc = (doc: {
  name?: string;
  fields?: Record<string, { stringValue?: string; integerValue?: string }>;
}): DirectoryEntry => ({
  uid: (doc.name ?? '').split('/').pop() ?? '',
  email: doc.fields?.email?.stringValue ?? '',
  name: doc.fields?.name?.stringValue ?? '',
  role: doc.fields?.role?.stringValue ?? '',
  children: Number(doc.fields?.children?.integerValue ?? 0),
  appVersion: doc.fields?.appVersion?.stringValue ?? '',
  lastSeen: doc.fields?.lastSeen?.stringValue ?? '',
});

/**
 * Records that this account exists and when it was last used. Failure is
 * silent on purpose: a tablet with no signal must keep working exactly as it
 * does now, and a child's board can never wait on a network call.
 */
export async function publishProfile(
  uid: string,
  user: AppUser,
  childCount: number,
  appVersion: string,
): Promise<void> {
  if (!project || !token) return;
  try {
    await fetch(`${base()}/users/${uid}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(
        toFields({
          email: user.email ?? '',
          name: user.name,
          role: user.role,
          children: childCount,
          appVersion,
          lastSeen: new Date().toISOString(),
        }),
      ),
    });
  } catch {
    // offline is the normal case, not an error worth showing anyone
  }
}

/** Every account, for the owner. Anyone else is refused by the rules. */
export async function fetchDirectory(): Promise<DirectoryEntry[]> {
  if (!project) throw new Error('Cloud is not set up on this device.');
  if (!token) throw new Error('Sign in with your email first to see this.');
  const res = await fetch(`${base()}/users?pageSize=300`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 403) {
    throw new Error(`Only ${OWNER_EMAIL} can read the user list.`);
  }
  if (!res.ok) throw new Error('Could not reach the user list.');
  const data = (await res.json()) as { documents?: Parameters<typeof fromDoc>[0][] };
  return (data.documents ?? []).map(fromDoc).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}
