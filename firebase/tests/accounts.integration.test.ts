import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  disableNetwork,
  doc,
  enableNetwork,
  getDocFromServer,
  getFirestore,
  terminate,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ensureProfile, saveProfile, watchProfile } from '@/features/auth/profileService';
import { defaultStudyBudgets, parseUserProfile } from '@/features/auth/profileValidation';
import type { UserProfile } from '@/shared/types/planner';

let live: { app: FirebaseApp; auth: Auth; database: Firestore };
vi.mock('@/lib/firebase/client', () => ({ getFirebaseServices: () => live }));
// Synthetic credentials, exclusively for disposable local emulators.
const password = 'local-emulator-test-123';
let counter = 0;
function email() {
  return `local-${Date.now()}-${++counter}@example.test`;
}
async function createAccount() {
  return (await createUserWithEmailAndPassword(live.auth, email(), password)).user;
}
async function readProfile(uid: string) {
  return parseUserProfile((await getDocFromServer(doc(live.database, 'users', uid))).data());
}

beforeAll(async () => {
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (!authHost || !firestoreHost)
    throw new Error('Run npm run test:integration to start both local emulators.');
  const [host, port] = firestoreHost.split(':');
  if (host !== '127.0.0.1' || !authHost.startsWith('127.0.0.1:'))
    throw new Error('Integration tests only connect to loopback emulators.');
  const app = initializeApp(
    { projectId: 'demo-studyflow', apiKey: 'demo-api-key', appId: 'demo-studyflow-app' },
    'accounts-integration',
  );
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
  await setPersistence(auth, inMemoryPersistence);
  const database = getFirestore(app);
  connectFirestoreEmulator(database, host, Number(port));
  live = { app, auth, database };
});
afterEach(async () => {
  await signOut(live.auth);
});
afterAll(async () => {
  if (live) {
    await terminate(live.database);
    await deleteApp(live.app);
  }
});

describe('real Auth/Firestore profile integration', () => {
  it('registers, creates and observes a private profile, then reloads it after signing in again', async () => {
    const account = await createAccount();
    const observed = new Promise<UserProfile>((resolve, reject) => {
      let stop: () => void = () => {};
      const timer = setTimeout(() => {
        stop();
        reject(new Error('Profile observation timed out'));
      }, 10_000);
      stop = watchProfile(
        account.uid,
        (profile) => {
          if (profile) {
            clearTimeout(timer);
            stop();
            resolve(profile);
          }
        },
        (error) => {
          clearTimeout(timer);
          stop();
          reject(error);
        },
      );
    });
    await ensureProfile(account.uid, 'Local student');
    const profile = await observed;
    expect(profile.displayName).toBe('Local student');
    expect(profile.studyBudgetMinutes).toEqual(defaultStudyBudgets());
    await signOut(live.auth);
    expect(live.auth.currentUser).toBeNull();
    await signInWithEmailAndPassword(live.auth, account.email!, password);
    expect((await readProfile(account.uid)).displayName).toBe('Local student');
  });
  it('saves all seven budgets and rejects a stale revision without overwriting data', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Initial');
    const initial = await readProfile(account.uid);
    const budgets = { ...defaultStudyBudgets(), 1: 1440, 2: 60 };
    const saved = await saveProfile(
      account.uid,
      { displayName: ' Saved name ', studyBudgetMinutes: budgets },
      initial.updatedAt,
    );
    expect(saved.displayName).toBe('Saved name');
    expect(saved.studyBudgetMinutes).toEqual(budgets);
    expect(saved.createdAt.isEqual(initial.createdAt)).toBe(true);
    await expect(
      saveProfile(
        account.uid,
        { displayName: 'Stale overwrite', studyBudgetMinutes: budgets },
        initial.updatedAt,
      ),
    ).rejects.toThrow('another session');
    expect((await readProfile(account.uid)).displayName).toBe('Saved name');
  });
  it('keeps another account out through both the service and direct Firestore SDK', async () => {
    const first = await createAccount();
    await ensureProfile(first.uid, 'First student');
    await signOut(live.auth);
    const second = await createAccount();
    await ensureProfile(second.uid, 'Second student');
    await expect(getDocFromServer(doc(live.database, 'users', first.uid))).rejects.toMatchObject({
      code: 'permission-denied',
    });
    await expect(ensureProfile(first.uid, 'Intruder')).rejects.toThrow('owner');
    expect((await readProfile(second.uid)).displayName).toBe('Second student');
    await signOut(live.auth);
    await expect(getDocFromServer(doc(live.database, 'users', second.uid))).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });
  it('preserves an existing profile on idempotent setup retry', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Original');
    const first = await readProfile(account.uid);
    await ensureProfile(account.uid, 'Must not replace');
    const after = await readProfile(account.uid);
    expect(after.displayName).toBe('Original');
    expect(after.createdAt.isEqual(first.createdAt)).toBe(true);
    expect(after.updatedAt.isEqual(first.updatedAt)).toBe(true);
  });
  it('rejects offline edits without queuing a later surprise write', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Online name');
    const profile = await readProfile(account.uid);
    await disableNetwork(live.database);
    await expect(
      saveProfile(
        account.uid,
        { displayName: 'Offline name', studyBudgetMinutes: defaultStudyBudgets() },
        profile.updatedAt,
      ),
    ).rejects.toThrow();
    await enableNetwork(live.database);
    expect((await readProfile(account.uid)).displayName).toBe('Online name');
  });
  it('handles invalid credentials without changing the signed-out session', async () => {
    const account = await createAccount();
    await signOut(live.auth);
    await expect(
      signInWithEmailAndPassword(live.auth, account.email!, 'incorrect-password'),
    ).rejects.toThrow();
    expect(live.auth.currentUser).toBeNull();
  });
});
