import { Capacitor, registerPlugin } from '@capacitor/core';

interface KidLockNative {
  lock(): Promise<void>;
  unlock(): Promise<void>;
}

const KidLock = registerPlugin<KidLockNative>('KidLock');

/** Kid lock uses Android screen pinning — only meaningful in the installed app */
export const kidLockAvailable =
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export async function lockApp(): Promise<boolean> {
  try {
    await KidLock.lock();
    return true;
  } catch {
    return false;
  }
}

export async function unlockApp(): Promise<boolean> {
  try {
    await KidLock.unlock();
    return true;
  } catch {
    return false;
  }
}
