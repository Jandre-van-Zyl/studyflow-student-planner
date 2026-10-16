export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export type FirebaseConfiguration =
  { mode: 'disabled' } | { mode: 'emulator' | 'cloud'; options: FirebaseWebConfig };

const cloudFields = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  appId: 'VITE_FIREBASE_APP_ID',
} as const;

export function readFirebaseConfiguration(
  environment: Record<string, unknown>,
): FirebaseConfiguration {
  const mode = String(environment.VITE_FIREBASE_MODE ?? 'disabled').trim();
  if (mode === 'disabled') return { mode };
  if (mode === 'emulator') {
    return {
      mode,
      options: {
        apiKey: 'demo-api-key',
        authDomain: 'demo-studyflow.firebaseapp.com',
        projectId: 'demo-studyflow',
        appId: 'demo-studyflow-app',
      },
    };
  }
  if (mode !== 'cloud') throw new Error('VITE_FIREBASE_MODE must be disabled, emulator or cloud.');
  const missing = Object.values(cloudFields).filter(
    (key) => !String(environment[key] ?? '').trim(),
  );
  if (missing.length)
    throw new Error(`Cloud Firebase configuration is missing: ${missing.join(', ')}.`);
  return {
    mode,
    options: {
      apiKey: String(environment.VITE_FIREBASE_API_KEY).trim(),
      authDomain: String(environment.VITE_FIREBASE_AUTH_DOMAIN).trim(),
      projectId: String(environment.VITE_FIREBASE_PROJECT_ID).trim(),
      appId: String(environment.VITE_FIREBASE_APP_ID).trim(),
    },
  };
}
