import { useCallback, useEffect, useMemo, useState } from 'react';
import { isOwnerEmail } from '../config';
import { fetchEntitlement, saveEntitlement } from '../services/subscription';
import {
  adminCount,
  clearSession,
  isOwner,
  loadSession,
  loadUsers,
  makeUser,
  noteFailure,
  noteSuccess,
  saveSession,
  saveUsers,
  verifyPin,
  withNewPin,
  type NewUserInput,
} from '../services/auth';
import type { AppUser } from '../types';

/**
 * Grown-up accounts + the current session. Kept separate from useProfiles:
 * users are the caregivers who sign in, profiles are the children who talk.
 */
export function useAuth() {
  const [users, setUsers] = useState<AppUser[]>(() => loadUsers());
  const [userId, setUserId] = useState<string | null>(() => loadSession());

  useEffect(() => {
    saveUsers(users);
  }, [users]);

  const user = useMemo(
    () => users.find((u) => u.id === userId) ?? null,
    [users, userId],
  );

  // A session pointing at a deleted account is stale — drop it
  useEffect(() => {
    if (userId && !user) {
      clearSession();
      setUserId(null);
    }
  }, [userId, user]);

  const signIn = useCallback(
    async (id: string, pin: string, remember: boolean): Promise<boolean> => {
      const found = users.find((u) => u.id === id);
      if (!found) return false;
      const ok = await verifyPin(found, pin);
      if (!ok) {
        noteFailure(id);
        return false;
      }
      noteSuccess(id);
      // verifyPin hands back an upgraded record when the hash was re-derived
      if (ok !== found) setUsers((prev) => prev.map((u) => (u.id === id ? ok : u)));
      saveSession(id, remember);
      setUserId(id);
      return true;
    },
    [users],
  );

  /** Used after a successful cloud sign-in, which has already proven identity */
  const signInAs = useCallback((id: string, remember: boolean) => {
    saveSession(id, remember);
    setUserId(id);
  }, []);

  /**
   * Completes an email sign-in that the cloud has already authenticated.
   * The email must belong to an account on this tablet — except for the app
   * owner, who is provisioned on the spot so they can support any install.
   * Returns an error message, or null when the sign-in went through.
   */
  const resolveCloudSignIn = useCallback(
    async (
      cloud: { uid: string; email: string; idToken?: string },
      remember: boolean,
    ): Promise<string | null> => {
      const email = cloud.email.trim().toLowerCase();
      // Entitlement is refreshed opportunistically: a failure here must never
      // block the sign-in, so the cached record simply stays as it is.
      const refresh = (localId: string) => {
        if (!cloud.idToken) return;
        void fetchEntitlement(cloud.uid, cloud.idToken).then((e) => {
          if (e) saveEntitlement(localId, e);
        });
      };
      const match = users.find((u) => u.email === email);
      if (match) {
        refresh(match.id);
        setUsers((prev) =>
          prev.map((u) => (u.id === match.id ? { ...u, cloudUid: cloud.uid } : u)),
        );
        saveSession(match.id, remember);
        setUserId(match.id);
        return null;
      }
      if (isOwnerEmail(email)) {
        // A PIN is required by the record shape; a random one is set here and
        // the owner can choose their own in Settings → My PIN afterwards.
        const created = await makeUser({
          name: 'App owner',
          role: 'admin',
          pin: String(Math.floor(100000 + Math.random() * 900000)),
          email,
        });
        setUsers((prev) => [...prev, { ...created, cloudUid: cloud.uid }]);
        refresh(created.id);
        saveSession(created.id, remember);
        setUserId(created.id);
        return null;
      }
      return 'No account on this tablet uses that email. Ask the admin to add it in Settings → Accounts.';
    },
    [users],
  );

  const signOut = useCallback(() => {
    clearSession();
    setUserId(null);
  }, []);

  const createUser = useCallback(async (input: NewUserInput): Promise<AppUser> => {
    const created = await makeUser(input);
    setUsers((prev) => [...prev, created]);
    return created;
  }, []);

  const updateUser = useCallback((id: string, patch: Partial<AppUser>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        // The owner account stays an admin no matter what is patched into it
        const next = { ...u, ...patch };
        return isOwner(next) ? { ...next, role: 'admin' as const } : next;
      }),
    );
  }, []);

  const setUserPin = useCallback(async (id: string, pin: string) => {
    const target = loadUsers().find((u) => u.id === id);
    if (!target) return;
    const updated = await withNewPin(target, pin);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
  }, []);

  /** Refuses to remove the last admin, or the account currently signed in */
  const removeUser = useCallback(
    (id: string): string | null => {
      const target = users.find((u) => u.id === id);
      if (!target) return 'That account no longer exists.';
      if (id === userId) return 'You cannot delete the account you are signed in to.';
      if (isOwner(target)) return 'The app owner account cannot be removed.';
      if (target.role === 'admin' && adminCount(users) <= 1) {
        return 'This is the only admin — make another admin first.';
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return null;
    },
    [users, userId],
  );

  /** Drops a deleted child from every parent's allow-list */
  const forgetKid = useCallback((kidId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.kidIds.includes(kidId)
          ? { ...u, kidIds: u.kidIds.filter((k) => k !== kidId) }
          : u,
      ),
    );
  }, []);

  return {
    users,
    user,
    needsSetup: users.length === 0,
    isAdmin: user?.role === 'admin',
    signIn,
    signInAs,
    resolveCloudSignIn,
    signOut,
    createUser,
    updateUser,
    setUserPin,
    removeUser,
    forgetKid,
  };
}
