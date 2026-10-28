import { saveCtuImport, watchCtuImports } from '@/features/ctu/ctuImportService';
import { planCtuAssessment, refreshCtuPlans } from '@/features/ctu/ctuPlanningService';
import { combinePortalPages } from '@/features/ctu/portalContract';
import { type CtuSavedView } from '@/features/ctu/ctuImportContract';
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
  collection,
  getDocsFromServer,
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

function ctuFixture() {
  return combinePortalPages(
    [
      {
        kind: 'uploads',
        portalName: 'Synthetic Student',
        course: 'Synthetic Course 2026',
        modules: [
          { name: 'KM MDB622', sourceId: '1' },
          { name: 'PM MDB622', sourceId: '2' },
        ],
        assessments: [
          {
            module: 'KM MDB622',
            title: 'FA1',
            due: '2026-10-26',
            sourceId: '12',
            submitted: false,
          },
        ],
        documents: [],
        resources: [],
        warnings: [],
      },
    ],
    new Date(Date.now() - 10000),
  );
}
function readCtu(uid: string) {
  return new Promise<CtuSavedView>((resolve, reject) => {
    let stop = () => {};
    const timer = setTimeout(() => {
      stop();
      reject(new Error('CTU listener timeout'));
    }, 10000);
    stop = watchCtuImports(
      uid,
      (value) => {
        clearTimeout(timer);
        stop();
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        stop();
        reject(error);
      },
    );
  });
}
describe('real account-scoped CTU import integration', () => {
  it('keeps a completed assignment and its completion time through resync, repeated planning and sign-in', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Synthetic Student');
    const snapshot = ctuFixture();
    await saveCtuImport(account.uid, snapshot);
    const source = (await readCtu(account.uid)).items.find((item) => item.kind === 'assessment')!;
    const choices = {
      subjectId: '',
      type: 'Assignment' as const,
      priority: 'Medium' as const,
      remainingMinutes: 60,
      planningTime: '18:00',
    };
    const id = await planCtuAssessment(account.uid, source.id, choices);
    const view = await observePlanner(account.uid);
    await savePlannerRecord(account.uid, 'assessments', {
      ...view.assessments[0]!,
      status: 'Completed',
      remainingMinutes: 0,
      description: 'Submitted and checked by the student.',
    });
    const reference = doc(live.database, 'users', account.uid, 'assessments', id);
    const completedAt = (await getDocFromServer(reference)).data()!.completedAt;
    expect(completedAt).not.toBeNull();
    snapshot.capturedAt = new Date().toISOString();
    snapshot.assessments[0]!.title = 'FA1 amended';
    snapshot.assessments[0]!.due = '2026-10-30T23:30';
    snapshot.assessments[0]!.submitted = true;
    await saveCtuImport(account.uid, snapshot);
    // A later portal snapshot without an upload indicator must not reopen completed work.
    snapshot.capturedAt = new Date().toISOString();
    snapshot.assessments[0]!.submitted = false;
    await saveCtuImport(account.uid, snapshot);
    await refreshCtuPlans(account.uid);
    expect(await planCtuAssessment(account.uid, source.id, choices)).toBe(id);
    await signOut(live.auth);
    await signInWithEmailAndPassword(live.auth, account.email!, password);
    const reloaded = await observePlanner(account.uid);
    expect(reloaded.subjects).toHaveLength(1);
    expect(reloaded.assessments).toHaveLength(1);
    expect(reloaded.assessments[0]).toMatchObject({
      id,
      title: 'FA1 amended',
      dueAt: '2026-10-30T23:30:00+02:00',
      status: 'Completed',
      remainingMinutes: 0,
      description: 'Submitted and checked by the student.',
    });
    expect((await getDocFromServer(reference)).data()!.completedAt).toEqual(completedAt);
    const imported = await readCtu(account.uid);
    expect(imported.items.filter((item) => item.kind === 'assessment')).toHaveLength(1);
    expect(imported.links).toHaveLength(1);
    expect(imported.links![0]).toMatchObject({ assessmentId: id, conflict: false });
  });
  it('serializes competing identifier variants before either can create a duplicate', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Synthetic Student');
    const identified = ctuFixture();
    const unidentified = structuredClone(identified);
    unidentified.assessments[0]!.sourceId = null;
    const results = await Promise.allSettled([
      saveCtuImport(account.uid, identified),
      saveCtuImport(account.uid, unidentified),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled').length).toBeGreaterThanOrEqual(1);
    expect((await readCtu(account.uid)).items.filter((i) => i.kind === 'assessment')).toHaveLength(
      1,
    );
  });
  it('adopts one newly supplied reference without changing the saved record, completion or links', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Synthetic Student');
    const snapshot = ctuFixture();
    snapshot.assessments[0]!.sourceId = null;
    snapshot.assessments[0]!.submitted = true;
    await saveCtuImport(account.uid, snapshot);
    const original = (await readCtu(account.uid)).items.find((i) => i.kind === 'assessment')!;
    const taskId = await planCtuAssessment(account.uid, original.id, {
      subjectId: '',
      type: 'Assignment',
      priority: 'Medium',
      remainingMinutes: 0,
      planningTime: '18:00',
      completed: true,
    });
    const taskRef = doc(live.database, 'users', account.uid, 'assessments', taskId);
    const completedAt = (await getDocFromServer(taskRef)).data()!.completedAt;
    snapshot.capturedAt = new Date().toISOString();
    snapshot.assessments[0]!.sourceId = '12';
    expect(await saveCtuImport(account.uid, snapshot)).toMatchObject({ added: 0, updated: 1 });
    snapshot.capturedAt = new Date().toISOString();
    snapshot.assessments[0]!.title = 'FA1 renamed by CTU';
    snapshot.assessments[0]!.due = '2026-10-30T23:30';
    await saveCtuImport(account.uid, snapshot);
    await saveCtuImport(account.uid, snapshot);
    const saved = await readCtu(account.uid);
    expect(saved.items.filter((i) => i.kind === 'assessment')).toHaveLength(1);
    expect(saved.items.find((i) => i.kind === 'assessment')).toMatchObject({
      id: original.id,
      sourceId: '12',
      title: 'FA1 renamed by CTU',
      dueDate: '2026-10-30',
    });
    expect(saved.links).toHaveLength(1);
    expect(saved.links![0]!.assessmentId).toBe(taskId);
    expect((await observePlanner(account.uid)).assessments).toHaveLength(1);
    expect((await getDocFromServer(taskRef)).data()).toMatchObject({
      status: 'Completed',
      remainingMinutes: 0,
      completedAt,
    });
  });
  it('retains the known reference when a later collection omits it', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Synthetic Student');
    const snapshot = ctuFixture();
    await saveCtuImport(account.uid, snapshot);
    const original = (await readCtu(account.uid)).items.find((i) => i.kind === 'assessment')!;
    snapshot.capturedAt = new Date().toISOString();
    snapshot.assessments[0]!.sourceId = null;
    snapshot.assessments[0]!.due = '2026-10-30T23:30';
    expect(await saveCtuImport(account.uid, snapshot)).toMatchObject({ added: 0, updated: 1 });
    const items = (await readCtu(account.uid)).items.filter((i) => i.kind === 'assessment');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: original.id, sourceId: '12', dueDate: '2026-10-30' });
  });
  it('refuses an ambiguous legacy reference upgrade before writing any source records', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Synthetic Student');
    const snapshot = ctuFixture();
    snapshot.assessments[0]!.sourceId = null;
    await saveCtuImport(account.uid, snapshot);
    const original = (await readCtu(account.uid)).items.find((i) => i.kind === 'assessment')!;
    snapshot.capturedAt = new Date().toISOString();
    snapshot.assessments[0]!.sourceId = '12';
    snapshot.assessments.push({ ...snapshot.assessments[0]!, sourceId: '13' });
    await expect(saveCtuImport(account.uid, snapshot)).rejects.toThrow(/ambiguous/);
    const saved = await readCtu(account.uid);
    expect(saved.items.filter((i) => i.kind === 'assessment')).toEqual([original]);
  });
  it('turns a source into one schedulable assessment, persists through sign-in, and resyncs without resetting student work', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Synthetic Student');
    const snapshot = ctuFixture();
    await saveCtuImport(account.uid, snapshot);
    const source = (await readCtu(account.uid)).items.find((i) => i.kind === 'assessment')!;
    const choices = {
      subjectId: '',
      type: 'Project' as const,
      priority: 'High' as const,
      remainingMinutes: 90,
      planningTime: '18:00',
    };
    const ids = await Promise.all([
      planCtuAssessment(account.uid, source.id, choices),
      planCtuAssessment(account.uid, source.id, choices),
    ]);
    expect(ids[0]).toBe(ids[1]);
    let view = await observePlanner(account.uid);
    expect(view.subjects).toHaveLength(1);
    expect(view.assessments).toHaveLength(1);
    const task = await savePlannerRecord(account.uid, 'assessments', {
      ...view.assessments[0]!,
      status: 'In Progress',
      description: 'My study notes',
      remainingMinutes: 45,
    });
    await savePlannerRecord(account.uid, 'blocks', {
      id: 'ctu-study',
      assessmentId: task.id,
      title: 'Revise this assessment',
      startAt: '2026-10-25T15:00:00+02:00',
      endAt: '2026-10-25T15:30:00+02:00',
      status: 'Planned',
    });
    snapshot.capturedAt = new Date().toISOString();
    snapshot.assessments[0]!.due = '2026-10-28T23:30';
    snapshot.assessments[0]!.title = 'FA1 revised';
    await saveCtuImport(account.uid, snapshot);
    await signOut(live.auth);
    await signInWithEmailAndPassword(live.auth, account.email!, password);
    view = await observePlanner(account.uid);
    expect(view.assessments).toHaveLength(1);
    expect(view.assessments[0]).toMatchObject({
      title: 'FA1 revised',
      dueAt: '2026-10-28T23:30:00+02:00',
      description: 'My study notes',
      remainingMinutes: 45,
      status: 'In Progress',
    });
    expect(view.blocks).toHaveLength(1);
    expect((await readCtu(account.uid)).links).toHaveLength(1);
    await savePlannerRecord(account.uid, 'assessments', {
      ...view.assessments[0]!,
      title: 'My own title',
      dueAt: '2026-10-27T19:00:00+02:00',
    });
    snapshot.capturedAt = new Date().toISOString();
    snapshot.assessments[0]!.due = '2026-10-29T20:00';
    await saveCtuImport(account.uid, snapshot);
    expect((await observePlanner(account.uid)).assessments[0]).toMatchObject({
      title: 'My own title',
      dueAt: '2026-10-27T19:00:00+02:00',
    });
    expect((await readCtu(account.uid)).links![0]!.conflict).toBe(true);
    await refreshCtuPlans(account.uid);
    await planCtuAssessment(account.uid, source.id, choices);
    expect((await observePlanner(account.uid)).assessments).toHaveLength(1);
  });
  it('does not create planner records for invalid choices, cancelled work, or another account', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Synthetic Student');
    await saveCtuImport(account.uid, ctuFixture());
    const source = (await readCtu(account.uid)).items.find((i) => i.kind === 'assessment')!;
    const choices = {
      subjectId: '',
      type: 'Project' as const,
      priority: 'High' as const,
      remainingMinutes: 30,
      planningTime: '',
    };
    await expect(planCtuAssessment(account.uid, source.id, choices)).rejects.toThrow();
    expect((await observePlanner(account.uid)).subjects).toHaveLength(0);
    const cancel = new AbortController();
    cancel.abort();
    await expect(
      planCtuAssessment(
        account.uid,
        source.id,
        { ...choices, planningTime: '18:00' },
        cancel.signal,
      ),
    ).rejects.toThrow(/session/);
    const other = await createAccount();
    await ensureProfile(other.uid, 'Other');
    await expect(
      planCtuAssessment(account.uid, source.id, { ...choices, planningTime: '18:00' }),
    ).rejects.toThrow(/session/);
    expect((await observePlanner(other.uid)).assessments).toHaveLength(0);
  });
  it('commits the supported 200-item bound without partially saving an oversized import', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Synthetic Student');
    const snapshot = ctuFixture();
    snapshot.resources = Array.from({ length: 197 }, (_, index) => `Synthetic resource ${index}`);
    expect((await saveCtuImport(account.uid, snapshot)).added).toBe(200);
    snapshot.resources.push('Over the bound');
    await expect(saveCtuImport(account.uid, snapshot)).rejects.toThrow(/200/);
    expect((await readCtu(account.uid)).items).toHaveLength(200);
  });
  it('automatically saves, reloads, deduplicates, retains missing records and tracks changed due dates', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Synthetic Student');
    const snapshot = ctuFixture();
    expect(await saveCtuImport(account.uid, snapshot)).toEqual({
      added: 3,
      updated: 0,
      unchanged: 0,
    });
    const first = await readCtu(account.uid);
    expect(first.items).toHaveLength(3);
    expect(first.items.find((i) => i.kind === 'assessment')).toMatchObject({
      dueDate: '2026-10-26',
      dueTime: '',
    });
    expect(await saveCtuImport(account.uid, snapshot)).toEqual({
      added: 0,
      updated: 0,
      unchanged: 3,
    });
    const changed = ctuFixture();
    changed.capturedAt = new Date().toISOString();
    changed.assessments[0]!.due = '2026-10-27T23:30';
    changed.modules = [];
    expect(await saveCtuImport(account.uid, changed)).toEqual({
      added: 0,
      updated: 1,
      unchanged: 0,
    });
    const reloaded = await readCtu(account.uid);
    expect(reloaded.items).toHaveLength(3);
    expect(reloaded.items.find((i) => i.kind === 'assessment')).toMatchObject({
      dueDate: '2026-10-27',
      dueTime: '23:30',
      previousDue: '2026-10-26',
    });
    expect(
      (await getDocsFromServer(collection(live.database, 'users', account.uid, 'assessments')))
        .empty,
    ).toBe(true);
    await expect(saveCtuImport(account.uid, snapshot)).rejects.toThrow(/newer CTU/);
  });
  it('keeps concurrent repeated imports idempotent and rejects cancelled saves', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Synthetic Student');
    const snapshot = ctuFixture();
    await Promise.all([saveCtuImport(account.uid, snapshot), saveCtuImport(account.uid, snapshot)]);
    expect((await readCtu(account.uid)).items).toHaveLength(3);
    const cancel = new AbortController();
    cancel.abort();
    await expect(saveCtuImport(account.uid, snapshot, cancel.signal)).rejects.toThrow(
      /session changed/,
    );
  });
  it('denies a second authenticated account all access to the first import', async () => {
    const first = await createAccount();
    await ensureProfile(first.uid, 'First');
    await saveCtuImport(first.uid, ctuFixture());
    const item = (await readCtu(first.uid)).items[0]!;
    const second = await createAccount();
    await ensureProfile(second.uid, 'Second');
    await expect(saveCtuImport(first.uid, ctuFixture())).rejects.toThrow(/session changed/);
    await expect(
      getDocFromServer(doc(live.database, 'users', first.uid, 'ctuItems', item.id)),
    ).rejects.toMatchObject({ code: 'permission-denied' });
    expect((await readCtu(second.uid)).items).toHaveLength(0);
  });
  it('cannot save after membership revocation and never queues offline imports', async () => {
    const account = await createAccount();
    await ensureProfile(account.uid, 'Synthetic Student');
    await disableNetwork(live.database);
    try {
      await expect(saveCtuImport(account.uid, ctuFixture())).rejects.toBeDefined();
    } finally {
      await enableNetwork(live.database);
    }
    expect((await readCtu(account.uid)).items).toHaveLength(0);
    await approveEmail(account.email!, false);
    await expect(saveCtuImport(account.uid, ctuFixture())).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });
});
