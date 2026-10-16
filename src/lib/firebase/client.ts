import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { readFirebaseConfiguration } from './config';

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  database: Firestore;
}

let services: FirebaseServices | undefined = import.meta.hot?.data.firebaseServices;

// Lazy: importing this file does not initialise Firebase or require a cloud account.
export function getFirebaseServices(): FirebaseServices {
  if (services) return services;
  const config = readFirebaseConfiguration(import.meta.env);
  if (config.mode === 'disabled') {
    throw new Error(
      'Firebase is disabled. See docs/development/FIREBASE.md before using data services.',
    );
  }
  const app =
    getApps().find((item) => item.name === 'studyflow') ??
    initializeApp(config.options, 'studyflow');
  const auth = getAuth(app);
  const database = getFirestore(app);
  if (config.mode === 'emulator') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFirestoreEmulator(database, '127.0.0.1', 8080);
  }
  services = { app, auth, database };
  return services;
}

if (import.meta.hot) {
  import.meta.hot.dispose((data) => {
    data.firebaseServices = services;
  });
}
