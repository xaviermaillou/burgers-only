import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import { auth } from './firebase.js';

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
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    throw error;
  }
}

export function observeAuthState(onChange) {
  return onAuthStateChanged(auth, onChange);
}

export async function readRedirectResult() {
  return getRedirectResult(auth);
}

export async function signOutUser() {
  await signOut(auth);
}
