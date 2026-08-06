/**
 * App-wide identities. These are deliberately compile-time constants rather
 * than settings: the owner account must not be something a device admin can
 * quietly point at their own address.
 */

/**
 * The app owner — responsible for every install, subscriptions and support.
 * An account with this email is always an admin, and can never be demoted or
 * deleted from a device. Signing in with it (cloud sign-in) grants admin
 * access on any tablet, which is what makes remote support possible.
 */
export const OWNER_EMAIL = 'lakshminarayana.kodavati@gmail.com';

/** Where "Need help?" writes to */
export const SUPPORT_EMAIL = OWNER_EMAIL;

/**
 * Where parents subscribe — a payment page you host (Razorpay, Stripe…).
 * Payment happens on the web, never inside the app: Google Play and Apple both
 * forbid an app from steering users to outside payment, so the app only ever
 * *reads* entitlement and shows this link where store rules allow.
 * Empty until the page exists; Settings then says so rather than linking off
 * to nowhere. Override per build with VITE_SUBSCRIBE_URL.
 */
export const SUBSCRIBE_URL =
  (import.meta.env.VITE_SUBSCRIBE_URL as string | undefined) ?? '';

/**
 * Your own endpoint that returns a generated picture for a tile.
 *
 * It must be a proxy you control (e.g. a Cloud Function), never a provider's
 * API key: anything shipped inside the APK can be extracted from it and spent
 * by whoever finds it. With no URL set, the editor simply hides the ✨ option.
 */
export const IMAGE_GEN_URL =
  (import.meta.env.VITE_IMAGE_GEN_URL as string | undefined) ?? '';

/**
 * Nothing is gated yet — deliberately. The child's board, tiles and speech
 * must never depend on a payment: a non-verbal child losing their voice
 * because a card expired is not an acceptable failure mode. Add the ids of
 * genuinely optional extras here when the plan is decided.
 */
export const PREMIUM_FEATURES: readonly string[] = [];

export const isOwnerEmail = (email: string | undefined) =>
  !!email && email.trim().toLowerCase() === OWNER_EMAIL;
