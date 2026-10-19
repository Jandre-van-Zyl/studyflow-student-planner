import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  applyActionCode,
  reload,
  getIdToken,
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
import { savePlannerRecord, watchPlanner } from '@/features/planner/plannerService';
import { exampleView, type PlanningView } from '@/features/planner/planningView';
import { watchMembership } from '@/features/auth/membershipService';

let live: { app: FirebaseApp; auth: Auth; database: Firestore };
vi.mock('@/lib/firebase/client', () => ({ getFirebaseServices: () => live }));
// Synthetic credentials, exclusively for disposable local emulators.
const password = 'local-emulator-test-123';
let counter = 0;
function email() {
  return `local-${Date.now()}-${++counter}@example.test`;
}
async function approveEmail(address: string, active = true) {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  if (!host?.startsWith('127.0.0.1:')) throw new Error('Local Firestore emulator required.');
  const response = await fetch(
    `http://${host}/v1/projects/demo-studyflow/databases/(default)/documents/approvedStudents/${encodeURIComponent(address.toLowerCase())}`,
    {
      method: 'PATCH',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { active: { booleanValue: active } } }),
    },
  );
  if (!response.ok) throw new Error('Local approval fixture failed.');
}
async function verifyAccount(account: import('firebase/auth').User) {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!host?.startsWith('127.0.0.1:')) throw new Error('Local Auth emulator required.');
  await sendEmailVerification(account);
  const response = await fetch(`http://${host}/emulator/v1/projects/demo-studyflow/oobCodes`);
  if (!response.ok) throw new Error('Local verification fixture failed.');
  const { oobCodes } = (await response.json()) as {
    oobCodes: { email: string; requestType: string; oobCode: string }[];
  };
  const code = oobCodes.find(
    (item) => item.email === account.email && item.requestType === 'VERIFY_EMAIL',
  )?.oobCode;
  if (!code) throw new Error('Local verification code not found.');
  await applyActionCode(live.auth, code);
  await reload(account);
  await getIdToken(account, true);
}
async function createAccount(approved = true) {
  const account = (await createUserWithEmailAndPassword(live.auth, email(), password)).user;
  if (approved) {
    await approveEmail(account.email!);
    await verifyAccount(account);
  }
  return account;
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
  it('requires real verification claims and approval, then denies access after deactivation', async () => {
    const account = await createAccount(false);
    await expect(ensureProfile(account.uid, 'Not yet')).rejects.toMatchObject({
      code: 'permission-denied',
    });
    await approveEmail(account.email!);
    await expect(ensureProfile(account.uid, 'Still unverified')).rejects.toMatchObject({
      code: 'permission-denied',
    });
    await verifyAccount(account);
    await new Promise<void>((resolve, reject) => {
      let stop: () => void = () => {};
      const timer = setTimeout(() => {
        stop();
        reject(new Error('Membership timed out'));
      }, 10000);
      stop = watchMembership(
        { uid: account.uid, email: account.email, emailVerified: account.emailVerified },
        (status) => {
          if (status === 'approved') {
            clearTimeout(timer);
            stop();
            resolve();
          }
        },
        (error) => {
          clearTimeout(timer);
          stop();
          reject(error);
        },
      );
    });
    await ensureProfile(account.uid, 'Admitted');
    expect((await readProfile(account.uid)).displayName).toBe('Admitted');
    await approveEmail(account.email!, false);
    await expect(readProfile(account.uid)).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(ensureProfile(account.uid, 'Revoked')).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });
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
  it('confirms a new budget while the existing profile listener is still active', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Listening student');
    let initial!: UserProfile;
    let stop: () => void = () => {};
    try {
      await new Promise<void>((resolve, reject) => {
        stop = watchProfile(
          account.uid,
          (profile) => {
            if (profile) {
              initial = profile;
              resolve();
            }
          },
          reject,
        );
      });
      const budgets = { ...defaultStudyBudgets(), 1: 60 };
      const saved = await saveProfile(
        account.uid,
        {
          displayName: initial.displayName,
          studyBudgetMinutes: budgets,
        },
        initial.updatedAt,
      );
      expect(saved.studyBudgetMinutes[1]).toBe(60);
      expect(saved.updatedAt.isEqual(initial.createdAt)).toBe(false);
    } finally {
      stop();
    }
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

function observePlanner(uid: string) {
  return new Promise<PlanningView>((resolve, reject) => {
    let stop = () => {};
    const timer = setTimeout(() => {
      stop();
      reject(new Error('Planner observation timed out'));
    }, 10000);
    stop = watchPlanner(
      uid,
      (data) => {
        clearTimeout(timer);
        stop();
        resolve(data);
      },
      (error) => {
        clearTimeout(timer);
        stop();
        reject(error);
      },
    );
  });
}
describe('real planner persistence contract', () => {
  it('saves linked records, observes/reloads them, detects stale edits, and preserves completion history', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Planner owner');
    const samples = exampleView();
    const subject = await savePlannerRecord(account.uid, 'subjects', samples.subjects[0]!);
    await savePlannerRecord(account.uid, 'classes', samples.classes[0]!);
    const assessment = await savePlannerRecord(account.uid, 'assessments', samples.assessments[0]!);
    const block = await savePlannerRecord(account.uid, 'blocks', samples.blocks[0]!);
    const complete = await savePlannerRecord(account.uid, 'assessments', {
      ...assessment,
      status: 'Completed',
      remainingMinutes: 0,
    });
    const completedRef = doc(live.database, 'users', account.uid, 'assessments', assessment.id);
    const firstCompletion = (await getDocFromServer(completedRef)).data()!.completedAt;
    await savePlannerRecord(account.uid, 'assessments', {
      ...complete,
      description: 'Completed notes',
    });
    expect(
      (await getDocFromServer(completedRef)).data()!.completedAt.isEqual(firstCompletion),
    ).toBe(true);
    await savePlannerRecord(account.uid, 'subjects', { ...subject, archived: true });
    await savePlannerRecord(account.uid, 'blocks', { ...block, status: 'Cancelled' });
    await expect(
      savePlannerRecord(account.uid, 'subjects', { ...subject, name: 'Stale' }),
    ).rejects.toThrow('another session');
    await signOut(live.auth);
    await signInWithEmailAndPassword(live.auth, account.email!, password);
    const loaded = await observePlanner(account.uid);
    expect(loaded.subjects[0]).toMatchObject({ archived: true, name: subject.name });
    expect(loaded.classes).toHaveLength(1);
    expect(loaded.blocks[0]).toMatchObject({ status: 'Cancelled', startAt: block.startAt });
    expect(loaded.assessments[0]).toMatchObject({ status: 'Completed', remainingMinutes: 0 });
    expect(
      (await getDocFromServer(completedRef)).data()!.completedAt.isEqual(firstCompletion),
    ).toBe(true);
    await savePlannerRecord(account.uid, 'assessments', {
      ...loaded.assessments[0]!,
      status: 'In Progress',
      remainingMinutes: 30,
    });
    const reopened = (await getDocFromServer(completedRef)).data()!;
    expect(reopened.completedAt).toBeNull();
    expect(reopened.remainingMinutes).toBe(30);
    expect((await observePlanner(account.uid)).blocks).toHaveLength(1);
  });
  it('makes identical creation retries idempotent and enforces concurrent subject-code uniqueness/rename', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Owner');
    const sample = exampleView().subjects[0]!;
    const saved = await savePlannerRecord(account.uid, 'subjects', sample);
    const retry = await savePlannerRecord(account.uid, 'subjects', sample);
    expect(retry.revision!.isEqual(saved.revision!)).toBe(true);
    await expect(
      savePlannerRecord(account.uid, 'subjects', { ...sample, id: 'duplicate' }),
    ).rejects.toThrow('code already');
    const outcomes = await Promise.allSettled(
      ['concurrent-a', 'concurrent-b'].map((id) =>
        savePlannerRecord(account.uid, 'subjects', { ...sample, id, code: 'RACE' }),
      ),
    );
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    const renamed = await savePlannerRecord(account.uid, 'subjects', { ...saved, code: 'SE3' });
    expect(renamed.id).toBe(saved.id);
    await savePlannerRecord(account.uid, 'subjects', { ...sample, id: 'reused-code' });
  });
  it('rejects offline writes without queued surprises and rejects wrong owners', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Owner');
    const saved = await savePlannerRecord(account.uid, 'subjects', exampleView().subjects[0]!);
    await disableNetwork(live.database);
    await expect(
      savePlannerRecord(account.uid, 'subjects', { ...saved, name: 'Offline' }),
    ).rejects.toThrow();
    await enableNetwork(live.database);
    expect((await observePlanner(account.uid)).subjects[0]!.name).toBe(saved.name);
    await signOut(live.auth);
    const other = await createAccount();
    await ensureProfile(other.uid, 'Other');
    await expect(savePlannerRecord(account.uid, 'subjects', saved)).rejects.toThrow('owner');
    await expect(
      getDocFromServer(doc(live.database, 'users', account.uid, 'subjects', saved.id)),
    ).rejects.toMatchObject({ code: 'permission-denied' });
    expect((await observePlanner(other.uid)).subjects).toHaveLength(0);
  });
});
