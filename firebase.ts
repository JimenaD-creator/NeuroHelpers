import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Replace every value below with your Firebase project's config
// Firebase console → Project Settings → Your apps → SDK setup
const firebaseConfig = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  databaseURL: 'https://REPLACE_ME-default-rtdb.firebaseio.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.firebasestorage.app',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
};

// Guard against duplicate initialization in Expo hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);
