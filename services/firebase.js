import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { firebaseConfig } from './firebase.config.js';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db, firebaseConfig };
