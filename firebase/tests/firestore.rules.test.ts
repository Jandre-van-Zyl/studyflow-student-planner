import { readFileSync } from 'node:fs';
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, it } from 'vitest';

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

describe('bootstrap Firestore guard', () => {
  it('denies unauthenticated reads', async () => {
    const database = environment.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(database, 'users/student-a')));
  });

  it('denies writes even by a signed-in owner until owner schemas are implemented', async () => {
    const database = environment.authenticatedContext('student-a').firestore();
    await assertFails(setDoc(doc(database, 'users/student-a'), { displayName: 'Student A' }));
  });
});
