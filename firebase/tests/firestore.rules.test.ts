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
  writeBatch,
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

function subjectData(code = 'SE2') {
  return {
    name: 'Software Engineering',
    code,
    colour: 'teal',
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}
async function createSubject(id = 'subject-a', code = 'SE2') {
  const db = owner();
  const batch = writeBatch(db);
  batch.set(doc(db, `users/student-a/subjects/${id}`), subjectData(code));
  batch.set(doc(db, `users/student-a/subjectCodes/${code}`), { subjectId: id });
  await batch.commit();
}
function assessmentData() {
  return {
    subjectId: 'subject-a',
    title: 'Requirements',
    type: 'Project',
    description: '',
    dueAt: Timestamp.fromDate(new Date('2026-10-20T10:00:00Z')),
    priority: 'High',
    status: 'To Do',
    remainingMinutes: 90,
    archived: false,
    completedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}
function classData() {
  return {
    subjectId: 'subject-a',
    weekday: 1,
    startTime: '09:00',
    endTime: '10:00',
    activeFrom: '2026-10-19',
    activeTo: '2026-11-30',
    location: '',
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}
function blockData(start = '2026-10-19T08:00:00Z', end = '2026-10-19T08:45:00Z') {
  return {
    assessmentId: 'assessment-a',
    title: 'Draft requirements',
    startAt: Timestamp.fromDate(new Date(start)),
    endAt: Timestamp.fromDate(new Date(end)),
    status: 'Planned',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}
async function linkedSeed() {
  await seed();
  await createSubject();
  await setDoc(doc(owner(), 'users/student-a/assessments/assessment-a'), assessmentData());
}
async function privateRecordFixture(kind: 'gradeReports' | 'studySessions') {
  await linkedSeed();
  const db = owner();
  await setDoc(doc(db, 'users/student-a/studyBlocks/block-a'), blockData());
  const id = kind === 'gradeReports' ? 'a'.repeat(64) : 'session-a';
  const nextId = kind === 'gradeReports' ? 'b'.repeat(64) : 'session-b';
  const data =
    kind === 'gradeReports'
      ? {
          course: 'Software Engineer',
          year: 2026,
          kind: 'results',
          payload: '{}',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      : {
          blockId: 'block-a',
          seconds: 60,
          startedAt: Timestamp.fromMillis(Date.now() - 120000),
          createdAt: serverTimestamp(),
        };
  const collectionPath = `users/student-a/${kind}`;
  await assertSucceeds(setDoc(doc(db, collectionPath, id), data));
  await assertSucceeds(getDoc(doc(db, collectionPath, id)));
  await assertSucceeds(getDocs(collection(db, collectionPath)));
  return { db, id, nextId, data, collectionPath };
}
describe('planner owner, schema and reference contracts', () => {
  it.each(['gradeReports', 'studySessions'] as const)(
    'denies another verified approved student all read/list/create access to private %s',
    async (kind) => {
      const { id, nextId, data, collectionPath } = await privateRecordFixture(kind);
      const other = environment
        .authenticatedContext('student-b', {
          email: 'student-b@example.test',
          email_verified: true,
        })
        .firestore();
      // Give the second account its own valid profile so denial proves ownership,
      // rather than merely the absence of a profile or membership approval.
      await assertSucceeds(setDoc(doc(other, 'users/student-b'), validProfile()));
      await assertFails(getDoc(doc(other, collectionPath, id)));
      await assertFails(getDocs(collection(other, collectionPath)));
      await assertFails(setDoc(doc(other, collectionPath, nextId), data));
      if (kind === 'gradeReports')
        await assertFails(
          updateDoc(doc(other, collectionPath, id), {
            payload: '{"changed":true}',
            updatedAt: serverTimestamp(),
          }),
        );
      else
        await assertFails(setDoc(doc(other, 'users/student-b/studySessions/foreign-block'), data));
    },
  );
  it.each(['gradeReports', 'studySessions'] as const)(
    'revokes existing owner read/list/create access to private %s immediately',
    async (kind) => {
      const { db, id, nextId, data, collectionPath } = await privateRecordFixture(kind);
      await environment.withSecurityRulesDisabled(async (context) => {
        await updateDoc(doc(context.firestore(), 'approvedStudents/student-a@example.test'), {
          active: false,
        });
      });
      await assertFails(getDoc(doc(db, collectionPath, id)));
      await assertFails(getDocs(collection(db, collectionPath)));
      await assertFails(setDoc(doc(db, collectionPath, nextId), data));
      if (kind === 'gradeReports')
        await assertFails(
          updateDoc(doc(db, collectionPath, id), {
            payload: '{"changed":true}',
            updatedAt: serverTimestamp(),
          }),
        );
    },
  );
  it('allows only private bounded grade reports and preserves report identity', async () => {
    await seed();
    const db = owner();
    const ref = doc(db, 'users/student-a/gradeReports/' + 'a'.repeat(64));
    const data = {
      course: 'Software Engineer',
      year: 2026,
      kind: 'results',
      payload: '{}',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await assertSucceeds(setDoc(ref, data));
    await assertFails(updateDoc(ref, { year: 2025, updatedAt: serverTimestamp() }));
    await assertFails(
      updateDoc(ref, { payload: 'x'.repeat(150001), updatedAt: serverTimestamp() }),
    );
    await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(), ref.path)));
    await assertFails(deleteDoc(ref));
  });
  it('keeps recorded study sessions private, immutable and bounded by elapsed time', async () => {
    await linkedSeed();
    const db = owner();
    await setDoc(doc(db, 'users/student-a/studyBlocks/block-a'), blockData());
    const value = {
      blockId: 'block-a',
      seconds: 60,
      startedAt: Timestamp.fromMillis(Date.now() - 120000),
      createdAt: serverTimestamp(),
    };
    const ref = doc(db, 'users/student-a/studySessions/session-a');
    await assertSucceeds(setDoc(ref, value));
    await assertFails(updateDoc(ref, { seconds: 120 }));
    await assertFails(deleteDoc(ref));
    await assertFails(
      getDoc(
        doc(
          environment.unauthenticatedContext().firestore(),
          'users/student-a/studySessions/session-a',
        ),
      ),
    );
    await assertFails(
      setDoc(doc(db, 'users/student-a/studySessions/too-long'), { ...value, seconds: 10801 }),
    );
    await assertFails(
      setDoc(doc(db, 'users/student-a/studySessions/future'), {
        ...value,
        startedAt: Timestamp.fromMillis(Date.now() + 60000),
      }),
    );
    await assertFails(
      setDoc(doc(db, 'users/student-a/studySessions/missing'), { ...value, blockId: 'missing' }),
    );
    await assertFails(
      setDoc(doc(db, 'users/student-a/studySessions/invented'), { ...value, seconds: 1000 }),
    );
  });
  it.each([
    { name: '' },
    { name: ' leading' },
    { name: 'two\nlines' },
    { code: 'se2' },
    { code: 'A/B' },
    { colour: 'red' },
    { archived: 'false' },
    { admin: true },
  ])('denies invalid subject %j even with a matching claim', async (change) => {
    await seed();
    const db = owner();
    const data = { ...subjectData(), ...change };
    const batch = writeBatch(db);
    batch.set(doc(db, 'users/student-a/subjects/invalid'), data);
    // Use a safe claim path even for deliberately invalid codes.
    batch.set(doc(db, 'users/student-a/subjectCodes/SE2'), { subjectId: 'invalid' });
    await assertFails(batch.commit());
  });
  it.each([15, 180])(
    'accepts the %i-minute block boundary and rejects forged metadata',
    async (minutes) => {
      await linkedSeed();
      const db = owner();
      const start = '2020-01-01T08:00:00Z';
      const end = new Date(Date.parse(start) + minutes * 60000).toISOString();
      const ref = doc(db, 'users/student-a/studyBlocks/boundary');
      await assertSucceeds(setDoc(ref, { ...blockData(start, end), status: 'Done' }));
      await assertFails(updateDoc(ref, { updatedAt: Timestamp.fromMillis(1) }));
      await assertFails(
        updateDoc(ref, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
      );
      await assertFails(deleteDoc(ref));
    },
  );
  it('accepts leap-day calendars and enforces completion timestamps across edit/reopen', async () => {
    await linkedSeed();
    const db = owner();
    await assertSucceeds(
      setDoc(doc(db, 'users/student-a/classSlots/leap'), {
        ...classData(),
        activeFrom: '2028-02-29',
        activeTo: '2028-02-29',
      }),
    );
    const ref = doc(db, 'users/student-a/assessments/assessment-a');
    await assertFails(
      updateDoc(ref, {
        status: 'Completed',
        remainingMinutes: 0,
        completedAt: Timestamp.fromMillis(1),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(ref, {
        status: 'Completed',
        remainingMinutes: 0,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(ref, { completedAt: serverTimestamp(), updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(ref, { status: 'In Progress', completedAt: null, updatedAt: serverTimestamp() }),
    );
    await assertSucceeds(
      updateDoc(ref, {
        status: 'In Progress',
        remainingMinutes: 30,
        completedAt: null,
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('permits the complete linked owner lifecycle and private collection reads', async () => {
    await linkedSeed();
    const db = owner();
    await assertSucceeds(setDoc(doc(db, 'users/student-a/classSlots/class-a'), classData()));
    await assertSucceeds(setDoc(doc(db, 'users/student-a/studyBlocks/block-a'), blockData()));
    for (const name of ['subjects', 'classSlots', 'assessments', 'studyBlocks'])
      await assertSucceeds(getDocs(collection(db, `users/student-a/${name}`)));
    await assertSucceeds(
      updateDoc(doc(db, 'users/student-a/assessments/assessment-a'), {
        status: 'Completed',
        remainingMinutes: 0,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db, 'users/student-a/subjects/subject-a'), {
        archived: true,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db, 'users/student-a/studyBlocks/block-a'), {
        status: 'Cancelled',
        updatedAt: serverTimestamp(),
      }),
    );
    expect((await getDoc(doc(db, 'users/student-a/studyBlocks/block-a'))).exists()).toBe(true);
  });
  it('requires atomic unique subject claims, supports rename, and prevents claim stealing', async () => {
    await seed();
    await assertFails(setDoc(doc(owner(), 'users/student-a/subjects/unclaimed'), subjectData()));
    await createSubject();
    await expect(createSubject('duplicate', 'SE2')).rejects.toThrow();
    const db = owner();
    const batch = writeBatch(db);
    batch.update(doc(db, 'users/student-a/subjects/subject-a'), {
      code: 'SE3',
      updatedAt: serverTimestamp(),
    });
    batch.delete(doc(db, 'users/student-a/subjectCodes/SE2'));
    batch.set(doc(db, 'users/student-a/subjectCodes/SE3'), { subjectId: 'subject-a' });
    await assertSucceeds(batch.commit());
    await assertFails(deleteDoc(doc(db, 'users/student-a/subjectCodes/SE3')));
    await assertFails(getDocs(collection(db, 'users/student-a/subjectCodes')));
  });
  it.each(['subjects', 'classSlots', 'assessments', 'studyBlocks'])(
    'denies unauthenticated/foreign reads, lists, edits and deletes of %s',
    async (name) => {
      await linkedSeed();
      for (const db of [
        environment.unauthenticatedContext().firestore(),
        environment
          .authenticatedContext('student-b', {
            email: 'student-b@example.test',
            email_verified: true,
          })
          .firestore(),
      ]) {
        const ref = doc(db, `users/student-a/${name}/record`);
        await assertFails(getDoc(ref));
        await assertFails(getDocs(collection(db, `users/student-a/${name}`)));
        await assertFails(setDoc(ref, assessmentData()));
        await assertFails(deleteDoc(ref));
      }
    },
  );
  it.each([
    { weekday: 0 },
    { weekday: 1.5 },
    { startTime: '25:00' },
    { endTime: '08:00' },
    { activeFrom: '2025-02-29' },
    { activeTo: '2026-02-30' },
    { activeTo: '2026-10-18' },
    { subjectId: 'foreign' },
    { location: 'x'.repeat(121) },
    { owner: 'student-a' },
  ])('denies invalid class %j', async (change) => {
    await linkedSeed();
    await assertFails(
      setDoc(doc(owner(), 'users/student-a/classSlots/class-a'), { ...classData(), ...change }),
    );
  });
  it.each([
    { status: 'Unknown' },
    { type: 'Other' },
    { priority: 'Urgent' },
    { remainingMinutes: 0 },
    { remainingMinutes: 1.5 },
    { remainingMinutes: 14401 },
    { status: 'Completed', remainingMinutes: 0 },
    { completedAt: serverTimestamp() },
    { title: '' },
    { description: 'x'.repeat(2001) },
    { subjectId: 'missing' },
    { admin: true },
    { dueAt: Timestamp.fromMillis(1001) },
  ])('denies invalid assessment %j', async (change) => {
    await linkedSeed();
    await assertFails(
      setDoc(doc(owner(), 'users/student-a/assessments/invalid'), {
        ...assessmentData(),
        ...change,
      }),
    );
  });
  it.each([
    {
      status: 'Done',
      startAt: Timestamp.fromDate(new Date('2099-01-01T09:00:00Z')),
      endAt: Timestamp.fromDate(new Date('2099-01-01T09:45:00Z')),
    },
    { assessmentId: 'missing' },
    { title: '' },
    { status: 'Unknown' },
    { endAt: Timestamp.fromDate(new Date('2026-10-19T08:14:00Z')) },
    { endAt: Timestamp.fromDate(new Date('2026-10-19T11:01:00Z')) },
    { endAt: Timestamp.fromDate(new Date('2026-10-19T07:45:00Z')) },
    {
      startAt: Timestamp.fromDate(new Date('2026-10-19T21:45:00Z')),
      endAt: Timestamp.fromDate(new Date('2026-10-19T22:15:00Z')),
    },
    { extra: true },
  ])('denies invalid block %j', async (change) => {
    await linkedSeed();
    await assertFails(
      setDoc(doc(owner(), 'users/student-a/studyBlocks/invalid'), { ...blockData(), ...change }),
    );
  });
  it('rejects new archived references but retains existing references and metadata on edits', async () => {
    await linkedSeed();
    const db = owner();
    await setDoc(doc(db, 'users/student-a/classSlots/class-a'), classData());
    await updateDoc(doc(db, 'users/student-a/subjects/subject-a'), {
      archived: true,
      updatedAt: serverTimestamp(),
    });
    await assertFails(setDoc(doc(db, 'users/student-a/classSlots/new'), classData()));
    await assertFails(setDoc(doc(db, 'users/student-a/assessments/new'), assessmentData()));
    await assertFails(setDoc(doc(db, 'users/student-a/studyBlocks/new'), blockData()));
    await assertSucceeds(
      updateDoc(doc(db, 'users/student-a/classSlots/class-a'), {
        location: 'Room 2',
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(db, 'users/student-a/assessments/assessment-a'), {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(deleteDoc(doc(db, 'users/student-a/assessments/assessment-a')));
  });
});

afterAll(async () => {
  await environment?.cleanup();
});
beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'approvedStudents/student-a@example.test'), {
      active: true,
    });
    await setDoc(doc(context.firestore(), 'approvedStudents/student-b@example.test'), {
      active: true,
    });
  });
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
  return environment
    .authenticatedContext('student-a', { email: 'student-a@example.test', email_verified: true })
    .firestore();
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
  it.each(['a/b@example.test', ' a@example.test', 'a@example.test ', 'invalid'])(
    'rejects unsupported token email: %s',
    async (email) => {
      const db = environment
        .authenticatedContext('student-a', { email, email_verified: true })
        .firestore();
      await assertFails(getDoc(doc(db, 'users/student-a')));
    },
  );
  it('admits a verified approved owner with a case-normalized token email', async () => {
    const db = environment
      .authenticatedContext('student-a', { email: 'STUDENT-A@EXAMPLE.TEST', email_verified: true })
      .firestore();
    await assertSucceeds(setDoc(doc(db, 'users/student-a'), validProfile()));
  });
  it.each([{ active: false }, { active: 'true' }, { active: true, role: 'admin' }, {}])(
    'fails closed for an invalid approval entry: %j',
    async (value) => {
      await seed();
      await environment.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'approvedStudents/student-a@example.test'), value);
      });
      await assertFails(getDoc(doc(owner(), 'users/student-a')));
    },
  );
  it('denies direct planner access and approval self-promotion after revocation', async () => {
    await seed();
    await createSubject();
    await environment.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'approvedStudents/student-a@example.test'), {
        active: false,
      });
    });
    const db = owner();
    for (const collectionName of [
      'subjects',
      'classSlots',
      'assessments',
      'studyBlocks',
      'subjectCodes',
    ]) {
      await assertFails(getDoc(doc(db, `users/student-a/${collectionName}/one`)));
      await assertFails(setDoc(doc(db, `users/student-a/${collectionName}/one`), {}));
    }
    await assertFails(
      updateDoc(doc(db, 'approvedStudents/student-a@example.test'), { active: true }),
    );
    await assertFails(deleteDoc(doc(db, 'approvedStudents/student-a@example.test')));
    await assertSucceeds(getDoc(doc(db, 'approvedStudents/student-a@example.test')));
  });
  it.each([
    { email: 'student-a@example.test', email_verified: false },
    { email: 'unlisted@example.test', email_verified: true },
    {},
  ])('denies profile access without verified approved membership: %j', async (claims) => {
    await seed();
    const db = environment.authenticatedContext('student-a', claims).firestore();
    await assertFails(getDoc(doc(db, 'users/student-a')));
    await assertFails(
      updateDoc(doc(db, 'users/student-a'), {
        displayName: 'Bypass',
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('lets a verified student get only their own approval status', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'approvedStudents/student-a@example.test'), {
        active: true,
      });
    });
    const db = environment
      .authenticatedContext('student-a', {
        email: 'STUDENT-A@EXAMPLE.TEST',
        email_verified: true,
      })
      .firestore();
    await assertSucceeds(getDoc(doc(db, 'approvedStudents/student-a@example.test')));
    await assertFails(getDoc(doc(db, 'approvedStudents/student-b@example.test')));
    await assertFails(getDocs(collection(db, 'approvedStudents')));
    await assertFails(setDoc(doc(db, 'approvedStudents/student-a@example.test'), { active: true }));
  });
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
      environment
        .authenticatedContext('student-b', {
          email: 'student-b@example.test',
          email_verified: true,
        })
        .firestore(),
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

function ctuItemData() {
  return {
    kind: 'assessment',
    portalName: 'Synthetic Student',
    course: 'Course 2026',
    title: 'FA1',
    module: 'KM MDB622',
    sourceId: '12',
    dueDate: '2026-10-26',
    dueTime: '',
    upload: 'unknown',
    url: '',
    previousDue: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}
describe('CTU source rules', () => {
  it('validates owner-only planning links and denies redirection, dangling links, forged metadata and deletion', async () => {
    await linkedSeed();
    const id = 'd'.repeat(64);
    const db = owner();
    const source = doc(db, `users/student-a/ctuItems/${id}`);
    const target = doc(db, `users/student-a/assessments/ctu-${id}`);
    const ref = doc(db, `users/student-a/ctuPlannerLinks/${id}`);
    await setDoc(source, ctuItemData());
    const input = {
      assessmentId: `ctu-${id}`,
      appliedTitle: 'Requirements',
      appliedDue: assessmentData().dueAt,
      sourceRevision: (await getDoc(source)).data()!.updatedAt,
      conflict: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await assertFails(setDoc(ref, input));
    await setDoc(target, assessmentData());
    await assertSucceeds(setDoc(ref, input));
    await assertSucceeds(getDocs(collection(db, 'users/student-a/ctuPlannerLinks')));
    await assertFails(
      updateDoc(ref, { assessmentId: 'assessment-a', updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(ref, { sourceRevision: Timestamp.fromMillis(0), updatedAt: serverTimestamp() }),
    );
    await assertFails(updateDoc(ref, { token: 'unexpected', updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(ref));
    const foreign = environment
      .authenticatedContext('student-b', { email: 'student-b@example.test', email_verified: true })
      .firestore();
    await assertFails(getDoc(doc(foreign, `users/student-a/ctuPlannerLinks/${id}`)));
    await assertFails(setDoc(doc(foreign, `users/student-a/ctuPlannerLinks/${id}`), input));
    await assertFails(
      getDoc(
        doc(
          environment.unauthenticatedContext().firestore(),
          `users/student-a/ctuPlannerLinks/${id}`,
        ),
      ),
    );
  });
  it('allows only approved owner reads and exact source schemas', async () => {
    await seed();
    const path = `users/student-a/ctuItems/${'a'.repeat(64)}`;
    await assertSucceeds(setDoc(doc(owner(), path), ctuItemData()));
    await assertSucceeds(getDoc(doc(owner(), path)));
    const foreign = environment
      .authenticatedContext('student-b', { email: 'student-b@example.test', email_verified: true })
      .firestore();
    await assertFails(getDoc(doc(foreign, path)));
    await assertFails(getDocs(collection(foreign, 'users/student-a/ctuItems')));
    await assertFails(setDoc(doc(foreign, path), ctuItemData()));
    await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(), path)));
    await assertFails(deleteDoc(doc(owner(), path)));
  });
  it.each([
    { dueDate: '2026-02-30' },
    { dueTime: '24:00' },
    { password: 'secret' },
    { upload: 'Completed' },
    { title: '' },
    { sourceId: '../foreign' },
    { url: 'https://evil.test' },
    { previousDue: '2026-10-01' },
  ])('rejects malformed CTU data %j', async (override) => {
    await seed();
    await assertFails(
      setDoc(doc(owner(), `users/student-a/ctuItems/${'b'.repeat(64)}`), {
        ...ctuItemData(),
        ...override,
      }),
    );
  });
  it('preserves source context and refuses metadata and previous-deadline forgery', async () => {
    await seed();
    const ref = doc(owner(), `users/student-a/ctuItems/${'c'.repeat(64)}`);
    await setDoc(ref, ctuItemData());
    await assertFails(updateDoc(ref, { course: 'Another course', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { previousDue: '2026-02-30', updatedAt: serverTimestamp() }));
    await assertFails(
      updateDoc(ref, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
    );
    await assertSucceeds(
      updateDoc(ref, {
        dueDate: '2026-10-27',
        previousDue: '2026-10-26',
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('validates connection metadata, owner access and monotonic capture time', async () => {
    await seed();
    const ref = doc(owner(), 'users/student-a/ctuConnections/current');
    const value = {
      portalName: 'Synthetic Student',
      course: '2026',
      capturedAt: Timestamp.fromMillis(Date.now() - 10000),
      coverage: 'home: next 30 days only',
      warnings: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await assertSucceeds(setDoc(ref, value));
    await assertFails(
      updateDoc(ref, { capturedAt: Timestamp.fromMillis(0), updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(ref, {
        capturedAt: Timestamp.fromMillis(Date.now() + 86400000),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(updateDoc(ref, { token: 'secret', updatedAt: serverTimestamp() }));
    await assertFails(
      getDoc(
        doc(
          environment.unauthenticatedContext().firestore(),
          'users/student-a/ctuConnections/current',
        ),
      ),
    );
  });
});
