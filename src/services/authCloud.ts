/**
 * Optional cloud sign-in (Firebase Authentication, email + password).
 *
 * Deliberately uses Google's REST endpoints rather than the Firebase SDK: no
 * extra dependency, nothing shipped to devices that do not use it, and the
 * app stays fully usable offline. Cloud sign-in is *identity only* — it never
 * becomes required, because an AAC device must work with the WiFi off.
 *
 * Enable by putting your Firebase Web API key in .env (see .env.example):
 *   VITE_FIREBASE_API_KEY=AIza...
 * With no key, the login screen simply shows PIN sign-in and nothing else.
 */

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const BASE = 'https://identitytoolkit.googleapis.com/v1/accounts';

export const cloudEnabled = () => !!API_KEY;

export interface CloudUser {
  uid: string;
  email: string;
  idToken: string;
}

/** Firebase error codes are SHOUTY_SNAKE; turn them into something a parent can read */
function friendlyError(code: string): string {
  switch (code.split(' ')[0]) {
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_LOGIN_CREDENTIALS':
    case 'INVALID_PASSWORD':
      return 'That email and password do not match.';
    case 'EMAIL_EXISTS':
      return 'An account with that email already exists.';
    case 'WEAK_PASSWORD':
      return 'Password must be at least 6 characters.';
    case 'USER_DISABLED':
      return 'That account has been disabled.';
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return 'Too many tries. Please wait a few minutes.';
    case 'OPERATION_NOT_ALLOWED':
      return 'Email sign-in is switched off in the Firebase project.';
    default:
      return 'Could not sign in. Please try again.';
  }
}

async function call(path: string, body: Record<string, unknown>): Promise<CloudUser> {
  if (!API_KEY) throw new Error('Cloud sign-in is not set up on this device.');
  let res: Response;
  try {
    res = await fetch(`${BASE}:${path}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, returnSecureToken: true }),
    });
  } catch {
    // No network — the caller falls back to PIN sign-in, which works offline
    throw new Error('No internet. Use your PIN to sign in on this tablet.');
  }
  const data = (await res.json().catch(() => ({}))) as {
    localId?: string;
    email?: string;
    idToken?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.idToken || !data.localId) {
    throw new Error(friendlyError(data.error?.message ?? ''));
  }
  return { uid: data.localId, email: data.email ?? '', idToken: data.idToken };
}

export const cloudSignIn = (email: string, password: string) =>
  call('signInWithPassword', { email: email.trim(), password });

export const cloudSignUp = (email: string, password: string) =>
  call('signUp', { email: email.trim(), password });

/** Sends Firebase's own password-reset email; harmless if the address is unknown */
export async function cloudResetPassword(email: string): Promise<void> {
  if (!API_KEY) throw new Error('Cloud sign-in is not set up on this device.');
  await fetch(`${BASE}:sendOobCode?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: email.trim() }),
  });
}
