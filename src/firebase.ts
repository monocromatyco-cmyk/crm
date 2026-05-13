import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCuDnX8g2sSJmQo3TtMqOuy7SibYayOtiY",
  authDomain: "orbita-e1fb5.firebaseapp.com",
  projectId: "orbita-e1fb5",
  storageBucket: "orbita-e1fb5.firebasestorage.app",
  messagingSenderId: "650762738257",
  appId: "1:650762738257:web:fdc0798ae4af2127acb670",
};

let db: ReturnType<typeof getFirestore> | null = null;
let firebaseEnabled = false;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  firebaseEnabled = true;
} catch (e) {
  console.warn('Firebase not available, using localStorage only', e);
  firebaseEnabled = false;
}

export function isFirebaseEnabled() {
  return firebaseEnabled;
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
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const docData = snap.data();
          if (docData?.data !== undefined) {
            callback(docData.data);
          }
        }
      },
      (err) => {
        console.warn('Firestore listener error:', err);
      }
    );
  } catch {
    return null;
  }
}
