import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getRedirectResult,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import { app } from './firebase.js';

const AUTH_REDIRECT_PENDING_KEY = 'burgers-only-auth-redirect-pending';
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let persistenceRequest = null;

function ensurePersistence() {
  if (!persistenceRequest) {
    persistenceRequest = setPersistence(auth, browserLocalPersistence).catch((error) => {
      persistenceRequest = null;

      if (error?.code === 'auth/unsupported-persistence-type') {
        return;
      }

      throw error;
    });
  }

  return persistenceRequest;
}

export async function signInWithGoogle() {
  await ensurePersistence();

  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (error?.code === 'auth/popup-blocked') {
      sessionStorage.setItem(AUTH_REDIRECT_PENDING_KEY, 'true');
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectError) {
        sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
        throw redirectError;
      }
      return null;
    }

    throw error;
  }
}

export function observeAuthState(onChange) {
  return onAuthStateChanged(auth, onChange);
}

export async function readRedirectResult() {
  try {
    return await getRedirectResult(auth);
  } finally {
    sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
  }
}

export async function signOutUser() {
  await signOut(auth);
}
