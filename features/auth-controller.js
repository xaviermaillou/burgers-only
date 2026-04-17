import { observeAuthState, readRedirectResult, signInWithGoogle, signOutUser } from '../services/auth.js';

const DEFAULT_ACCOUNT_STATUS = 'Connectez-vous pour retrouver vos preferences et vos favoris.';

function getAuthErrorMessage(error) {
  const code = error?.code || '';

  if (code === 'auth/popup-closed-by-user') {
    return 'Connexion annulee.';
  }

  if (code === 'auth/cancelled-popup-request') {
    return 'Une connexion Google est deja en cours.';
  }

  if (code === 'auth/unauthorized-domain') {
    return 'Ce domaine nest pas autorise dans Firebase Authentication.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'La methode Google nest pas activee dans Firebase Authentication.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Probleme reseau pendant la connexion.';
  }

  return 'Impossible de finaliser la connexion Google pour le moment.';
}

export function initAuthController({
  googleAuthButton,
  googleAuthButtonLabel,
  accountStatus,
  onTrackEvent = null
}) {
  let authUser = null;
  let authRequestInFlight = false;

  const track = (eventName, payload = {}) => {
    if (typeof onTrackEvent === 'function') {
      onTrackEvent(eventName, payload);
    }
  };

  const setAccountStatus = (message = '', { isError = false } = {}) => {
    if (!accountStatus) {
      return;
    }

    accountStatus.textContent = message;
    accountStatus.classList.toggle('error', isError);
  };

  const getAuthButtonLabel = () => {
    if (authRequestInFlight) {
      return authUser ? 'Déconnexion...' : 'Connexion...';
    }

    return authUser ? 'Se déconnecter' : 'Continuer avec Google';
  };

  const syncAuthButton = () => {
    if (!googleAuthButton) {
      return;
    }

    const label = getAuthButtonLabel();
    if (googleAuthButtonLabel) {
      googleAuthButtonLabel.textContent = label;
    }

    googleAuthButton.setAttribute('aria-label', label);
    googleAuthButton.disabled = authRequestInFlight;
  };

  const getAccountDisplayName = (user) => {
    const displayName = String(user?.displayName || '').trim();
    if (displayName) {
      return displayName;
    }

    const email = String(user?.email || '').trim();
    if (email) {
      return email;
    }

    return 'cet utilisateur';
  };

  const renderAuthState = (nextUser) => {
    authUser = nextUser || null;

    if (!accountStatus) {
      return;
    }

    if (!authUser) {
      setAccountStatus(DEFAULT_ACCOUNT_STATUS);
      return;
    }

    const accountName = getAccountDisplayName(authUser);
    setAccountStatus(`Connecté en tant que ${accountName}.`);
  };

  const syncAuthDataLayer = (previousUser, nextUser) => {
    const previousUid = previousUser?.uid || null;
    const nextUid = nextUser?.uid || null;

    if (previousUid === nextUid) {
      return;
    }

    if (nextUid) {
      track('login', {
        auth_provider: 'google',
        user_id: nextUid
      });
      return;
    }

    if (previousUid) {
      track('logout', {
        auth_provider: 'google',
        user_id: previousUid
      });
    }
  };

  const reportAuthError = (error, { redirect = false } = {}) => {
    const code = error?.code || 'unknown';
    const message = getAuthErrorMessage(error);

    console.error('Google authentication failed.', error);
    setAccountStatus(message, { isError: true });
    track('auth_error', {
      auth_provider: 'google',
      auth_error_code: code,
      auth_mode: redirect ? 'redirect' : 'popup'
    });
  };

  if (googleAuthButton) {
    googleAuthButton.addEventListener('click', async () => {
      if (authRequestInFlight) {
        return;
      }

      authRequestInFlight = true;
      setAccountStatus(authUser ? 'Déconnexion en cours...' : 'Connexion en cours...');
      syncAuthButton();

      try {
        if (authUser) {
          await signOutUser();
        } else {
          await signInWithGoogle();
        }
      } catch (error) {
        authRequestInFlight = false;
        syncAuthButton();
        reportAuthError(error);
      }
    });
  }

  observeAuthState((nextUser) => {
    const previousUser = authUser;

    renderAuthState(nextUser);
    authRequestInFlight = false;
    syncAuthButton();
    syncAuthDataLayer(previousUser, nextUser);
  });

  readRedirectResult().catch((error) => {
    reportAuthError(error, { redirect: true });
  });

  renderAuthState(null);
  syncAuthButton();
}
