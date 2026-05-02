import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

let anonAuthPromise: Promise<void> | null = null;

/**
 * Ensures the visitor has a Firebase auth identity (anonymous if needed) so
 * that Firestore rules requiring `request.auth != null` are satisfied.
 *
 * Used on public-facing routes (/live, /family/*) where visitors aren't
 * Google-signed-in. Authenticated users are passed through unchanged.
 *
 * Throws if anonymous auth is disabled in the Firebase project — the caller
 * should surface a clear error so the project owner knows to enable it.
 */
export function ensureAnonymousAuth(): Promise<void> {
  if (anonAuthPromise) return anonAuthPromise;

  anonAuthPromise = new Promise<void>((resolve, reject) => {
    // If already signed in (anonymous or otherwise), pass through.
    if (auth.currentUser) {
      resolve();
      return;
    }
    // Listen for any pending sign-in to complete first.
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        resolve();
      }
    });
    // Kick off anonymous sign-in.
    signInAnonymously(auth)
      .then(() => {
        // onAuthStateChanged above will resolve once user is set.
      })
      .catch((err) => {
        unsub();
        anonAuthPromise = null;
        reject(err);
      });
  });

  return anonAuthPromise;
}
