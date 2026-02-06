// Configuration Firebase pour le client mobile
// Cette configuration permet d'accéder à Firebase directement sans passer par le backend

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  updateEmail,
  updatePassword,
  sendPasswordResetEmail,
  signOut,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { getRemoteConfig, getValue, fetchAndActivate } from 'firebase/remote-config';

// Configuration Firebase - À remplacer par vos propres valeurs
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const remoteConfig = getRemoteConfig(app);

// Configuration par défaut du Remote Config
remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 heure
remoteConfig.defaultConfig = {
  MAX_LOGIN_ATTEMPTS: 3
};

// Fonction pour récupérer une valeur du Remote Config
export async function getRemoteConfigValue(key: string): Promise<number | null> {
  try {
    await fetchAndActivate(remoteConfig);
    const value = getValue(remoteConfig, key);
    return value.asNumber() || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de Remote Config:', error);
    return null;
  }
}

export { app, auth, db, remoteConfig };
export type { User };
