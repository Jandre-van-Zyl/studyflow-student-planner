import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let environment: RulesTestEnvironment;

beforeAll(async () => {
  const address = process.env.FIRESTORE_EMULATOR_HOST;
  if (!address) throw new Error('Run npm run test:rules to start the local Firestore emulator.');
  const [host, port] = address.split(':');
  environment = await initializeTestEnvironment({
    projectId: 'demo-studyflow',
    firestore: {
      host,
      port: Number(port),
      rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});

afterAll(async () => {
  await environment?.cleanup();
});
beforeEach(async () => {
  await environment.clearFirestore();
});

function validProfile() {
  return {
    displayName: 'Student A',
    timezone: 'Africa/Johannesburg',
    studyBudgetMinutes: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1440 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}
function owner() {
  return environment.authenticatedContext('student-a').firestore();
}
async function seed() {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/student-a'), {
      ...validProfile(),
      createdAt: new Timestamp(1, 0),
      updatedAt: new Timestamp(1, 0),
    });
  });
}

describe('private profile schema and ownership', () => {
  it('allows an owner to read a missing profile for idempotent setup', async () => {
    const snapshot = await assertSucceeds(getDoc(doc(owner(), 'users/student-a')));
    expect(snapshot.exists()).toBe(false);
  });
  it('allows a valid own create, read and update with zero/inclusive maximum budgets', async () => {
    const reference = doc(owner(), 'users/student-a');
    await assertSucceeds(setDoc(reference, validProfile()));
    const first = await assertSucceeds(getDoc(reference));
    expect(first.data()?.studyBudgetMinutes['7']).toBe(1440);
    await assertSucceeds(
      updateDoc(reference, {
        displayName: 'Changed name',
        updatedAt: serverTimestamp(),
        'studyBudgetMinutes.1': 60,
      }),
    );
    const updated = await getDoc(reference);
    expect(updated.data()?.displayName).toBe('Changed name');
    expect(updated.data()?.createdAt).toEqual(first.data()?.createdAt);
  });
  it('denies listing profiles even to a signed-in student', async () => {
    await assertFails(getDocs(collection(owner(), 'users')));
  });
  it('denies owner deletion until a coordinated account deletion feature exists', async () => {
    await seed();
    await assertFails(deleteDoc(doc(owner(), 'users/student-a')));
  });
  it('prevents editing createdAt or supplying a forged updatedAt', async () => {
    await seed();
    const reference = doc(owner(), 'users/student-a');
    await assertFails(
      updateDoc(reference, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(reference, { displayName: 'Forgery', updatedAt: new Timestamp(5, 0) }),
    );
  });
  it('requires server timestamps on creation', async () => {
    await assertFails(
      setDoc(doc(owner(), 'users/student-a'), {
        ...validProfile(),
        createdAt: new Timestamp(1, 0),
        updatedAt: new Timestamp(1, 0),
      }),
    );
  });
  const invalid: [string, () => Record<string, unknown>][] = [
    ['empty name', () => ({ displayName: '' })],
    ['space-only name', () => ({ displayName: '  ' })],
    ['leading whitespace', () => ({ displayName: ' Student' })],
    ['trailing whitespace', () => ({ displayName: 'Student ' })],
    ['multiline name', () => ({ displayName: 'A\nB' })],
    ['carriage return in name', () => ({ displayName: 'A\rB' })],
    ['Unicode line separator', () => ({ displayName: 'A\u2028B' })],
    ['Unicode paragraph separator', () => ({ displayName: 'A\u2029B' })],
    ['leading nonbreaking space', () => ({ displayName: '\u00a0Student' })],
    ['trailing byte-order mark', () => ({ displayName: 'Student\ufeff' })],
    ['overlong name', () => ({ displayName: 'a'.repeat(81) })],
    ['non-string name', () => ({ displayName: 7 })],
    ['different timezone', () => ({ timezone: 'UTC' })],
    ['extra owner key', () => ({ ownerId: 'student-a' })],
    ['extra privilege key', () => ({ role: 'admin' })],
    ['password field', () => ({ password: 'never-store-this' })],
    ['missing weekday', () => ({ studyBudgetMinutes: { 1: 0 } })],
    [
      'extra weekday',
      () => ({ studyBudgetMinutes: { ...validProfile().studyBudgetMinutes, 8: 0 } }),
    ],
    [
      'negative budget',
      () => ({ studyBudgetMinutes: { ...validProfile().studyBudgetMinutes, 1: -1 } }),
    ],
    [
      'fractional budget',
      () => ({ studyBudgetMinutes: { ...validProfile().studyBudgetMinutes, 1: 0.5 } }),
    ],
    [
      'excessive budget',
      () => ({ studyBudgetMinutes: { ...validProfile().studyBudgetMinutes, 1: 1441 } }),
    ],
    [
      'text budget',
      () => ({ studyBudgetMinutes: { ...validProfile().studyBudgetMinutes, 1: '60' } }),
    ],
    ['null budgets', () => ({ studyBudgetMinutes: null })],
    ['list budgets', () => ({ studyBudgetMinutes: [0, 0, 0, 0, 0, 0, 0] })],
    ['wrong timestamp type', () => ({ createdAt: 'today' })],
  ];
  it.each(invalid)('denies %s at the database boundary', async (_, override) => {
    await assertFails(
      setDoc(doc(owner(), 'users/student-a'), { ...validProfile(), ...override() }),
    );
  });
  it('requires every profile field', async () => {
    for (const field of Object.keys(validProfile())) {
      const value: Record<string, unknown> = { ...validProfile() };
      delete value[field];
      await assertFails(setDoc(doc(owner(), 'users/student-a'), value));
    }
  });
  it('applies schema validation to updates as well as creates', async () => {
    await seed();
    await assertFails(
      updateDoc(doc(owner(), 'users/student-a'), {
        'studyBudgetMinutes.3': -1,
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it.each([
    'users/student-a',
    'users/student-a/subjects/one',
    'users/student-a/classSlots/one',
    'users/student-a/assessments/one',
    'users/student-a/studyBlocks/one',
  ])('denies anonymous reads/writes to %s', async (path) => {
    const reference = doc(environment.unauthenticatedContext().firestore(), path);
    await assertFails(getDoc(reference));
    await assertFails(setDoc(reference, validProfile()));
  });
  it('denies another account all profile operations', async () => {
    await seed();
    const reference = doc(
      environment.authenticatedContext('student-b').firestore(),
      'users/student-a',
    );
    await assertFails(getDoc(reference));
    await assertFails(setDoc(reference, validProfile()));
    await assertFails(
      updateDoc(reference, { displayName: 'Intruder', updatedAt: serverTimestamp() }),
    );
    await assertFails(deleteDoc(reference));
  });
  it.each(['subjects', 'classSlots', 'assessments', 'studyBlocks'])(
    'retains the deny guard on unfinished %s collections',
    async (name) => {
      const reference = doc(owner(), `users/student-a/${name}/one`);
      await assertFails(getDoc(reference));
      await assertFails(setDoc(reference, { title: 'Not yet implemented' }));
    },
  );
});
