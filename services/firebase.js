import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { firebaseConfig } from './firebase.config.js';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

let analyticsInstance = null;

async function ensureAnalytics() {
  if (analyticsInstance) {
    return analyticsInstance;
  }

  const supported = await isAnalyticsSupported();
  if (!supported) {
    return null;
  }

  analyticsInstance = getAnalytics(app);
  return analyticsInstance;
}

export { app, db, ensureAnalytics, firebaseConfig };
