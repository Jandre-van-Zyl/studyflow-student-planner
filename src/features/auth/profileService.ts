import {
  doc,
  getDocFromServer,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase/client';
import { PLANNING_TIMEZONE, type UserProfile } from '@/shared/types/planner';
import { ProfileConflictError } from './errors';
import {
  defaultStudyBudgets,
  parseUserProfile,
  validateDisplayName,
  validateProfileInput,
  type ProfileInput,
} from './profileValidation';

function ownProfile(uid: string) {
  const { auth, database } = getFirebaseServices();
  if (!uid || auth.currentUser?.uid !== uid)
    throw new Error('A current signed-in owner is required.');
  return { database, reference: doc(database, 'users', uid), auth };
}

export function watchProfile(
  uid: string,
  next: (profile: UserProfile | null) => void,
  fail: (error: unknown) => void,
): () => void {
  const { reference, auth } = ownProfile(uid);
  return onSnapshot(
    reference,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (
        auth.currentUser?.uid !== uid ||
        snapshot.metadata.fromCache ||
        snapshot.metadata.hasPendingWrites
      )
        return;
      try {
        next(snapshot.exists() ? parseUserProfile(snapshot.data()) : null);
      } catch (error) {
        fail(error);
      }
    },
    fail,
  );
}

// A server-only preflight also respects disableNetwork: transaction RPCs alone can
// bypass the SDK's offline switch. Re-read inside the transaction for concurrency.
export async function ensureProfile(uid: string, name: string): Promise<void> {
  const displayName = validateDisplayName(name);
  const { database, reference, auth } = ownProfile(uid);
  await getDocFromServer(reference);
  await runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (auth.currentUser?.uid !== uid)
      throw new Error('The account changed before profile creation.');
    if (snapshot.exists()) {
      parseUserProfile(snapshot.data());
      return;
    }
    transaction.set(reference, {
      displayName,
      timezone: PLANNING_TIMEZONE,
      studyBudgetMinutes: defaultStudyBudgets(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function saveProfile(
  uid: string,
  input: ProfileInput,
  expectedUpdatedAt: Timestamp,
): Promise<UserProfile> {
  const valid = validateProfileInput(input);
  const { database, reference, auth } = ownProfile(uid);
  await getDocFromServer(reference);
  await runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (auth.currentUser?.uid !== uid) throw new Error('The account changed before saving.');
    if (!snapshot.exists()) throw new Error('The profile is missing. Reload before saving.');
    const current = parseUserProfile(snapshot.data());
    if (!current.updatedAt.isEqual(expectedUpdatedAt)) throw new ProfileConflictError();
    transaction.update(reference, { ...valid, updatedAt: serverTimestamp() });
  });
  // A one-shot listener can reuse the pre-commit view of an already-active
  // listener. A separate read-only transaction confirms the committed revision.
  const confirmed = await runTransaction(database, (transaction) => transaction.get(reference));
  if (auth.currentUser?.uid !== uid)
    throw new Error('The account changed before save confirmation.');
  if (!confirmed.exists()) throw new Error('The saved profile could not be confirmed.');
  return parseUserProfile(confirmed.data());
}
