import { useState } from 'react';
import { OWNER_EMAIL } from '../config';
import {
  fetchDirectory,
  hasDirectoryToken,
  type DirectoryEntry,
} from '../services/directory';

/**
 * Who is using MTalk, for the owner only.
 *
 * Shows accounts, not children: name, email, role, how many children are on
 * that tablet, the app version and when it last ran. A child's board, tiles,
 * photos, recordings and progress never leave the device, so there is nothing
 * of theirs to show here — by design, not omission.
 */
export function UserDirectory() {
  const [rows, setRows] = useState<DirectoryEntry[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      setRows(await fetchDirectory());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the user list.');
    } finally {
      setBusy(false);
    }
  };

  const when = (iso: string) => {
    if (!iso) return 'never';
    const days = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  };

  return (
    <section>
      <h3>🌐 Users online ({rows?.length ?? '—'})</h3>
      <p className="ft-hint">
        Every account that has signed in with an email, across all tablets.
        Children's boards, photos, recordings and progress stay on their own
        device and are never uploaded — this list is accounts and access only.
      </p>

      {!hasDirectoryToken() ? (
        <p className="account-owner-hint">
          Sign in with <b>{OWNER_EMAIL}</b> using ✉️ email on the login screen
          to see this. A PIN sign-in never touches the network, so it cannot
          read the list.
        </p>
      ) : (
        <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
          <button className="btn-secondary" disabled={busy} onClick={() => void load()}>
            {busy ? 'Loading…' : rows ? '🔄 Refresh' : '🌐 Show users'}
          </button>
        </div>
      )}

      {error && <p className="gate-error">{error}</p>}

      {rows && rows.length === 0 && (
        <p className="ft-hint">
          Nobody has signed in with an email yet — only this tablet knows about
          its accounts so far.
        </p>
      )}

      {rows && rows.length > 0 && (
        <div className="custom-tile-list">
          {rows.map((r) => (
            <div key={r.uid} className="custom-tile-row account-row">
              <span className="profile-row-avatar">
                {r.email === OWNER_EMAIL ? '👑' : r.role === 'admin' ? '🛡️' : '👪'}
              </span>
              <span className="custom-tile-name">
                {r.name || '(no name)'}
                <small className="account-meta">
                  {r.email} · {r.role} · {r.children}{' '}
                  {r.children === 1 ? 'child' : 'children'} · v{r.appVersion} ·
                  last used {when(r.lastSeen)}
                </small>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
