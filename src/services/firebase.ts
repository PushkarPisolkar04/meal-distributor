// Firebase initialization. Uses the free Spark plan: Auth (email/password) +
// Cloud Firestore. No Cloud Functions / paid services. Auth state is persisted
// with AsyncStorage so users stay logged in across app restarts.

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth } from 'firebase/auth';
// getReactNativePersistence exists in Firebase's RN build but is missing from the
// web type definitions, so we import it with a type escape hatch.
// @ts-expect-error - not present in firebase/auth web typings
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function readConfig(): FirebaseConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as { firebase?: FirebaseConfig };
  const cfg = extra.firebase;
  if (!cfg || !cfg.apiKey || !cfg.projectId) {
    throw new Error(
      'Firebase config missing. Copy .env.example to .env and fill EXPO_PUBLIC_FIREBASE_* values.',
    );
  }
  return cfg;
}

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(readConfig());
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  const app = getFirebaseApp();
  try {
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialized (e.g. fast refresh) -> reuse.
    _auth = getAuth(app);
  }
  return _auth;
}

export function getDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getFirebaseApp());
  return _db;
}
