import { useState } from 'react';
import { isOwner } from '../services/auth';
import type { AppUser, Profile, UserRole } from '../types';

interface AccountsSectionProps {
  users: AppUser[];
  currentUser: AppUser;
  profiles: Profile[];
  onCreate: (input: {
    name: string;
    role: UserRole;
    pin: string;
    email?: string;
    kidIds: string[];
  }) => Promise<void>;
  onUpdate: (id: string, patch: Partial<AppUser>) => void;
  onSetPin: (id: string, pin: string) => Promise<void>;
  onRemove: (id: string) => string | null;
}

/**
 * Admin-only account management inside Settings: add parents, say which
 * children each may open, reset a forgotten PIN, remove an account.
 */
export function AccountsSection({
  users,
  currentUser,
  profiles,
  onCreate,
  onUpdate,
  onSetPin,
  onRemove,
}: AccountsSectionProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('parent');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [kidIds, setKidIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPin, setResetPin] = useState('');

  const toggleKid = (id: string) =>
    setKidIds((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));

  const add = async () => {
    if (!name.trim()) {
      setMessage('Give the account a name.');
      return;
    }
    if (pin.length < 4) {
      setMessage('PIN must be at least 4 digits.');
      return;
    }
    if (role === 'parent' && kidIds.length === 0) {
      setMessage('Pick at least one child this parent looks after.');
      return;
    }
    if (email.trim() && users.some((u) => u.email === email.trim().toLowerCase())) {
      setMessage('Another account already uses that email.');
      return;
    }
    await onCreate({
      name,
      role,
      pin,
      email: email.trim() || undefined,
      kidIds: role === 'admin' ? [] : kidIds,
    });
    setName('');
    setPin('');
    setEmail('');
    setKidIds([]);
    setMessage(`Added ${name.trim()}.`);
  };

  const kidNames = (u: AppUser) =>
    u.role === 'admin'
      ? 'all children'
      : profiles
          .filter((p) => u.kidIds.includes(p.id))
          .map((p) => p.name)
          .join(', ') || 'no children yet';

  return (
    <section>
      <h3>🔐 Accounts ({users.length})</h3>
      <p className="ft-hint">
        Admins manage the tablet, the children and these accounts. Parents only
        see the children assigned to them.
      </p>

      <div className="custom-tile-list">
        {users.map((u) => (
          <div key={u.id} className="custom-tile-row account-row">
            <span className="profile-row-avatar">
              {isOwner(u) ? '👑' : u.role === 'admin' ? '🛡️' : '👪'}
            </span>
            <span className="custom-tile-name">
              {u.name}
              {u.id === currentUser.id && ' ✅'}
              <small className="account-meta">
                {isOwner(u) ? 'App owner · support' : u.role === 'admin' ? 'Admin' : 'Parent'} ·{' '}
                {kidNames(u)}
                {u.email ? ` · ${u.email}` : ''}
              </small>
            </span>
            <button
              className="btn-secondary btn-small"
              onClick={() => {
                setResetFor(resetFor === u.id ? null : u.id);
                setResetPin('');
                setMessage('');
              }}
            >
              🔑 PIN
            </button>
            {u.id !== currentUser.id && !isOwner(u) && (
              <>
                <button
                  className="btn-secondary btn-small"
                  onClick={() =>
                    onUpdate(u.id, {
                      role: u.role === 'admin' ? 'parent' : 'admin',
                      // an admin covers every child, so the list is cleared
                      kidIds: u.role === 'admin' ? u.kidIds : [],
                    })
                  }
                >
                  {u.role === 'admin' ? '↓ Parent' : '↑ Admin'}
                </button>
                <button
                  className="btn-delete"
                  aria-label={`Delete account ${u.name}`}
                  onClick={() => setMessage(onRemove(u.id) ?? `Removed ${u.name}.`)}
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {resetFor && (
        <div className="add-row">
          <input
            className="text-field add-row-field"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="New PIN (4–6 digits)"
            value={resetPin}
            onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ''))}
          />
          <button
            className="btn-secondary"
            onClick={async () => {
              if (resetPin.length < 4) {
                setMessage('PIN must be at least 4 digits.');
                return;
              }
              await onSetPin(resetFor, resetPin);
              setResetFor(null);
              setResetPin('');
              setMessage('PIN updated.');
            }}
          >
            Save PIN
          </button>
        </div>
      )}

      <h4 className="account-sub">➕ Add an account</h4>
      <div className="add-row">
        <input
          className="text-field add-row-field"
          type="text"
          maxLength={24}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="text-field add-row-field"
          type="password"
          inputMode="numeric"
          maxLength={6}
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      <div className="add-row">
        <input
          className="text-field add-row-field"
          type="email"
          placeholder="Email (optional — for cloud sign-in)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="segmented account-role">
          <button className={role === 'parent' ? 'seg-active' : ''} onClick={() => setRole('parent')}>
            👪 Parent
          </button>
          <button className={role === 'admin' ? 'seg-active' : ''} onClick={() => setRole('admin')}>
            🛡️ Admin
          </button>
        </div>
      </div>

      {role === 'parent' && (
        <div className="account-kids">
          <p className="ft-hint">Which children does this parent look after?</p>
          {profiles.map((p) => (
            <label key={p.id} className="account-kid">
              <input
                type="checkbox"
                checked={kidIds.includes(p.id)}
                onChange={() => toggleKid(p.id)}
              />
              {p.emoji} {p.name}
            </label>
          ))}
        </div>
      )}

      <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
        <button className="btn-primary" onClick={() => void add()}>
          ➕ Add account
        </button>
      </div>
      {message && <p className="progress-line">{message}</p>}
    </section>
  );
}
