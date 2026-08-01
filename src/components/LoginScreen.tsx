import { useEffect, useRef, useState } from 'react';
import { playPop } from '../services/speech';
import { isOwner, lockoutRemaining, strongHashAvailable } from '../services/auth';
import { cloudEnabled, cloudResetPassword, cloudSignIn, cloudSignUp } from '../services/authCloud';
import { SUPPORT_EMAIL } from '../config';
import { APP_VERSION } from '../version';
import type { AppUser, UserRole } from '../types';

const PIN_MIN = 4;
const PIN_MAX = 6;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'ok'];

const ROLE_BADGE: Record<UserRole, string> = {
  admin: '🛡️ Admin',
  parent: '👪 Parent',
};

export interface SetupInput {
  name: string;
  pin: string;
  email?: string;
}

interface LoginScreenProps {
  users: AppUser[];
  /** No accounts yet — collect the first admin instead of showing a picker */
  needsSetup: boolean;
  onSetup: (input: SetupInput) => Promise<void>;
  onSignIn: (userId: string, pin: string, remember: boolean) => Promise<boolean>;
  /** Hands an authenticated cloud user to the app; returns an error, or null */
  onCloudSignIn: (
    cloud: { uid: string; email: string },
    remember: boolean,
  ) => Promise<string | null>;
}

/** Opens the mail app with the version and device already filled in */
function supportLink(context: string) {
  const body = [
    'Tell us what is happening:',
    '',
    '',
    '---',
    `MTalk v${APP_VERSION}`,
    `Screen: ${context}`,
    `Device: ${navigator.userAgent}`,
  ].join('\n');
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    'MTalk help',
  )}&body=${encodeURIComponent(body)}`;
}

/**
 * Numeric keypad — big targets, works on a tablet without a keyboard.
 * Digits are reported one at a time and applied with a functional update, so
 * fast taps on a slow tablet cannot drop one against a stale render.
 */
function Keypad({
  canSubmit,
  onDigit,
  onBack,
  onSubmit,
  disabled,
}: {
  canSubmit: boolean;
  onDigit: (digit: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <div className="pin-pad">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          className={`pin-key ${k === 'ok' ? 'pin-key-ok' : ''} ${k === 'back' ? 'pin-key-back' : ''}`}
          disabled={disabled || (k === 'ok' && !canSubmit)}
          onClick={() => {
            playPop();
            if (k === 'back') onBack();
            else if (k === 'ok') onSubmit();
            else onDigit(k);
          }}
        >
          {k === 'back' ? '⌫' : k === 'ok' ? '✅' : k}
        </button>
      ))}
    </div>
  );
}

const Dots = ({ length }: { length: number }) => (
  <div className="pin-dots" aria-hidden="true">
    {Array.from({ length: PIN_MAX }, (_, i) => (
      <span key={i} className={`pin-dot ${i < length ? 'pin-dot-on' : ''}`} />
    ))}
  </div>
);

/**
 * Sign-in for grown-ups, shown before the app. Two ways in: the device PIN
 * (always available, works offline) and — when a Firebase key is configured —
 * an email account, which is matched to an account already on this tablet.
 */
export function LoginScreen({
  users,
  needsSetup,
  onSetup,
  onSignIn,
  onCloudSignIn,
}: LoginScreenProps) {
  const [picked, setPicked] = useState<AppUser | null>(
    users.length === 1 ? users[0] : null,
  );
  const [mode, setMode] = useState<'pin' | 'cloud'>('pin');
  // The PIN itself lives in a ref (never stale between taps); state only
  // carries its length, which is all the dots need.
  const pinRef = useRef('');
  const [pinLen, setPinLen] = useState(0);
  const setPin = (next: string) => {
    pinRef.current = next;
    setPinLen(next.length);
  };
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  // Setup fields (first run)
  const [name, setName] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');

  // Cloud fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');

  // Tick down a lockout so the buttons re-enable on their own
  useEffect(() => {
    if (!picked) return;
    const id = window.setInterval(() => setWait(lockoutRemaining(picked.id)), 500);
    return () => window.clearInterval(id);
  }, [picked]);

  const submitPin = async () => {
    if (!picked || busy) return;
    const locked = lockoutRemaining(picked.id);
    if (locked > 0) {
      setError(`Too many tries — wait ${Math.ceil(locked / 1000)}s.`);
      return;
    }
    setBusy(true);
    const ok = await onSignIn(picked.id, pinRef.current, remember);
    setBusy(false);
    if (!ok) {
      setPin('');
      setWait(lockoutRemaining(picked.id));
      setError('Wrong PIN. Try again.');
    }
  };

  const submitSetup = async () => {
    if (busy) return;
    if (setupPin.length < PIN_MIN) {
      setError(`PIN must be at least ${PIN_MIN} digits.`);
      return;
    }
    if (setupPin !== confirmPin) {
      setError('The two PINs do not match.');
      return;
    }
    setBusy(true);
    try {
      // An optional cloud account is created first: if Firebase rejects it,
      // nothing local has changed yet and the message is still fixable.
      if (cloudEnabled() && setupEmail.trim() && setupPassword) {
        await cloudSignUp(setupEmail, setupPassword);
      }
      await onSetup({
        name,
        pin: setupPin,
        email: setupEmail.trim() ? setupEmail : undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the account.');
    } finally {
      setBusy(false);
    }
  };

  const submitCloud = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const cloud = await cloudSignIn(email, password);
      const failure = await onCloudSignIn(cloud, remember);
      if (failure) setError(failure);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  const brand = (
    <div className="brand profile-brand">
      <span className="brand-logo" aria-hidden="true">🗣️</span>
      <span className="brand-name">MTalk</span>
    </div>
  );

  const support = (
    <a className="login-support" href={supportLink(needsSetup ? 'setup' : mode)}>
      ❓ Need help? Email support
    </a>
  );

  // ---------------------------------------------------------- first-run setup
  if (needsSetup) {
    return (
      <div className="profile-screen login-screen">
        {brand}
        <h1 className="profile-question">Welcome — set up this tablet</h1>
        <p className="login-sub">
          You are the grown-up in charge here: you add the children, other
          parents or carers, and keep the backups. It takes a minute.
        </p>
        <div className="login-card">
          <label className="login-label" htmlFor="setup-name">Your name</label>
          <input
            id="setup-name"
            className="text-field"
            type="text"
            autoFocus
            maxLength={24}
            placeholder="e.g. Amma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="login-label" htmlFor="setup-pin">
            Choose a PIN ({PIN_MIN}–{PIN_MAX} digits)
          </label>
          <input
            id="setup-pin"
            className="text-field"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={PIN_MAX}
            value={setupPin}
            onChange={(e) => {
              setSetupPin(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
          />

          <label className="login-label" htmlFor="setup-pin2">Repeat the PIN</label>
          <input
            id="setup-pin2"
            className="text-field"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={PIN_MAX}
            value={confirmPin}
            onChange={(e) => {
              setConfirmPin(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
          />

          {cloudEnabled() && (
            <>
              <p className="ft-hint login-divider">
                Optional — add an email account so you can sign in on another
                tablet. The PIN above keeps working with no internet.
              </p>
              <input
                className="text-field"
                type="email"
                autoComplete="email"
                placeholder="Email (optional)"
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
              />
              <input
                className="text-field"
                type="password"
                autoComplete="new-password"
                placeholder="Password (6+ characters)"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
              />
            </>
          )}

          {!strongHashAvailable() && (
            <p className="ft-hint login-warn">
              ⚠️ This page is not on a secure (https) connection, so the PIN is
              stored with weaker protection. It is upgraded automatically the
              next time you sign in over https or in the installed app.
            </p>
          )}
          {error && <p className="gate-error">{error}</p>}

          <button className="btn-primary login-go" disabled={busy} onClick={() => void submitSetup()}>
            {busy ? 'Creating…' : 'Start using MTalk'}
          </button>
        </div>
        {support}
      </div>
    );
  }

  // ------------------------------------------------------------ account picker
  if (!picked) {
    return (
      <div className="profile-screen login-screen">
        {brand}
        <h1 className="profile-question">Who is signing in?</h1>
        <div className="profile-grid">
          {users.map((u) => (
            <button
              key={u.id}
              className="profile-card"
              onClick={() => {
                playPop();
                setPicked(u);
                setPin('');
                setError('');
              }}
            >
              <span className="profile-avatar" aria-hidden="true">
                {isOwner(u) ? '👑' : u.role === 'admin' ? '🛡️' : '👪'}
              </span>
              <span className="profile-name">{u.name}</span>
              <span className="login-role">
                {isOwner(u) ? '👑 App owner' : ROLE_BADGE[u.role]}
              </span>
            </button>
          ))}
        </div>
        {cloudEnabled() && (
          <button
            className="btn-secondary login-switch"
            onClick={() => {
              setPicked(users[0] ?? null);
              setMode('cloud');
            }}
          >
            ✉️ Sign in with email instead
          </button>
        )}
        {support}
      </div>
    );
  }

  // ------------------------------------------------------------- sign-in form
  return (
    <div className="profile-screen login-screen">
      {brand}
      {mode === 'pin' ? (
        <>
          <h1 className="profile-question">
            {picked.role === 'admin' ? '🛡️' : '👪'} {picked.name}
          </h1>
          <p className="login-sub">Enter your PIN</p>
          <Dots length={pinLen} />
          <Keypad
            canSubmit={pinLen >= PIN_MIN}
            onDigit={(d) => {
              if (pinRef.current.length < PIN_MAX) setPin(pinRef.current + d);
              setError('');
            }}
            onBack={() => {
              setPin(pinRef.current.slice(0, -1));
              setError('');
            }}
            onSubmit={() => void submitPin()}
            disabled={busy || wait > 0}
          />
        </>
      ) : (
        <>
          <h1 className="profile-question">Sign in with email</h1>
          <div className="login-card">
            <input
              className="text-field"
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="text-field"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void submitCloud()}
            />
            <button className="btn-primary login-go" disabled={busy} onClick={() => void submitCloud()}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              className="btn-link"
              onClick={() => {
                if (!email.trim()) {
                  setError('Type your email first.');
                  return;
                }
                void cloudResetPassword(email);
                setNotice('If that email has an account, a reset link is on its way.');
              }}
            >
              Forgot password?
            </button>
          </div>
        </>
      )}

      {error && <p className="gate-error">{error}</p>}
      {notice && <p className="progress-line">{notice}</p>}
      {wait > 0 && (
        <p className="gate-error">Locked for {Math.ceil(wait / 1000)}s after too many tries.</p>
      )}

      <label className="login-remember">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        Stay signed in on this tablet
      </label>
      <p className="ft-hint login-remember-hint">
        Keep this on so the child can reach their board after a restart without
        waiting for a grown-up.
      </p>

      <div className="login-links">
        {users.length > 1 && (
          <button
            className="btn-secondary"
            onClick={() => {
              setPicked(null);
              setPin('');
              setError('');
              setMode('pin');
            }}
          >
            ← Someone else
          </button>
        )}
        {cloudEnabled() && (
          <button
            className="btn-secondary"
            onClick={() => {
              setMode(mode === 'pin' ? 'cloud' : 'pin');
              setError('');
              setNotice('');
            }}
          >
            {mode === 'pin' ? '✉️ Use email' : '🔢 Use PIN'}
          </button>
        )}
      </div>
      {support}
    </div>
  );
}
