import {
  collection,
  getDocFromServer,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase/client';
export interface StudySession {
  id: string;
  blockId: string;
  seconds: number;
}
export function parseStudySession(id: string, value: unknown): StudySession {
  const v = value as Record<string, unknown>;
  if (
    !v ||
    Object.keys(v).sort().join(',') !== 'blockId,createdAt,seconds,startedAt' ||
    typeof v.blockId !== 'string' ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(v.blockId) ||
    !Number.isInteger(v.seconds) ||
    Number(v.seconds) < 1 ||
    Number(v.seconds) > 10800 ||
    !(v.startedAt instanceof Timestamp) ||
    !(v.createdAt instanceof Timestamp)
  )
    throw new Error('Invalid recorded study session.');
  return { id, blockId: v.blockId, seconds: Number(v.seconds) };
}
export function watchStudySessions(
  uid: string,
  next: (sessions: StudySession[]) => void,
  fail: () => void,
) {
  const { auth, database } = getFirebaseServices();
  if (auth.currentUser?.uid !== uid) throw new Error('Sign in before loading study time.');
  return onSnapshot(
    collection(database, 'users', uid, 'studySessions'),
    { includeMetadataChanges: true },
    (snap) => {
      if (
        auth.currentUser?.uid !== uid ||
        snap.metadata.fromCache ||
        snap.metadata.hasPendingWrites
      )
        return;
      try {
        next(snap.docs.map((row) => parseStudySession(row.id, row.data())));
      } catch {
        fail();
      }
    },
    fail,
  );
}
export async function saveStudySession(
  uid: string,
  id: string,
  blockId: string,
  seconds: number,
  startedAt: number,
  finishBlock: boolean,
) {
  if (
    !/^[A-Za-z0-9_-]{1,128}$/.test(id) ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(blockId) ||
    !Number.isInteger(seconds) ||
    seconds < 1 ||
    seconds > 10800 ||
    !Number.isFinite(startedAt) ||
    startedAt > Date.now()
  )
    throw new Error('Invalid timer session.');
  const { auth, database } = getFirebaseServices();
  const user = auth.currentUser;
  if (!user || user.uid !== uid) throw new Error('Sign in before saving study time.');
  const session = doc(database, 'users', uid, 'studySessions', id);
  const block = doc(database, 'users', uid, 'studyBlocks', blockId);
  await getDocFromServer(session);
  await runTransaction(database, async (tx) => {
    const [old, planned] = await Promise.all([tx.get(session), tx.get(block)]);
    if (auth.currentUser !== user) throw new Error('Your account changed before saving.');
    if (old.exists()) {
      const recorded = parseStudySession(id, old.data());
      if (recorded.blockId !== blockId || recorded.seconds !== seconds)
        throw new Error('This timer session was already recorded differently.');
      return;
    }
    if (!planned.exists() || planned.data().status === 'Cancelled')
      throw new Error('This study block is unavailable or cancelled.');
    tx.set(session, {
      blockId,
      seconds,
      startedAt: Timestamp.fromMillis(startedAt),
      createdAt: serverTimestamp(),
    });
    if (
      finishBlock &&
      planned.data().status === 'Planned' &&
      planned.data().startAt.toMillis() <= Date.now()
    )
      tx.update(block, { status: 'Done', updatedAt: serverTimestamp() });
  });
}
