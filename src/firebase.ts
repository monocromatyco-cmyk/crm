import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  type DocumentReference,
  type Unsubscribe,
} from 'firebase/firestore';

// ── Firebase config ──
// Using a public Firestore database for single-user PWA sync.
// Security rules should restrict access in production.
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForDemo",
  authDomain: "orbita-crm-sync.firebaseapp.com",
  projectId: "orbita-crm-sync",
  storageBucket: "orbita-crm-sync.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:abcdef1234567890",
};

let db: ReturnType<typeof getFirestore> | null = null;
let firebaseEnabled = false;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  firebaseEnabled = true;
} catch {
  console.warn('Firebase not available, using localStorage only');
  firebaseEnabled = false;
}

export function isFirebaseEnabled() {
  return firebaseEnabled;
}

export function getDocRef(collection: string, docId: string): DocumentReference | null {
  if (!db) return null;
  return doc(db, collection, docId);
}

export async function syncToFirestore(collection: string, docId: string, data: unknown) {
  if (!db) return;
  try {
    const ref = doc(db, collection, docId);
    await setDoc(ref, { data, updatedAt: Date.now() });
  } catch (err) {
    console.warn('Firestore sync failed:', err);
  }
}

export function listenToFirestore(
  collection: string,
  docId: string,
  callback: (data: unknown) => void
): Unsubscribe | null {
  if (!db) return null;
  try {
    const ref = doc(db, collection, docId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const docData = snap.data();
        if (docData?.data !== undefined) {
          callback(docData.data);
        }
      }
    }, (err) => {
      console.warn('Firestore listener error:', err);
    });
  } catch {
    return null;
  }
}
