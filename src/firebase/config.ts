import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Fill these in from your Firebase project settings
// (Firebase console → Project settings → General → Your apps → SDK setup and config).
// See README.md for step-by-step setup instructions.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

// When unconfigured, initialize with harmless placeholder values so the SDK
// doesn't throw at import time — App.tsx shows a setup screen instead of
// ever calling auth/db in that state.
export const app = initializeApp(
  firebaseConfigured ? firebaseConfig : { apiKey: 'demo-key', projectId: 'demo-project' },
)
export const auth = getAuth(app)
export const db = getFirestore(app)
