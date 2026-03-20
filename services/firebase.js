import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDk9yPdTJ4JATs5Axng0Xhp8y_XPBt1GNI',
  authDomain: 'burgers-only.firebaseapp.com',
  projectId: 'burgers-only',
  storageBucket: 'burgers-only.firebasestorage.app',
  messagingSenderId: '362248336638',
  appId: '1:362248336638:web:7f0a8da3b35dba60b0e1af',
  measurementId: 'G-PN2F3J6FB2'
};

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
