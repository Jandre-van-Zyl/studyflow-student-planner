import {
  collection,
  doc,
  getDocFromServer,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase/client';
import { parsePortalSnapshot } from './portalContract';
import {
  ctuInput,
  EMPTY_CTU,
  parseCtuConnection,
  parseCtuItem,
  prepareCtuImport,
  type CtuSavedView,
} from './ctuImportContract';

function owner(uid: string, signal?: AbortSignal) {
  const services = getFirebaseServices();
  if (!uid || services.auth.currentUser?.uid !== uid || signal?.aborted)
    throw new Error('The StudyFlow session changed. Connect again from your account.');
  return services;
}
export async function saveCtuImport(
  uid: string,
  value: unknown,
  signal?: AbortSignal,
): Promise<{ added: number; updated: number; unchanged: number }> {
  const snapshot = parsePortalSnapshot(value);
  const rows = await prepareCtuImport(snapshot);
  const { database, auth } = owner(uid, signal);
  const session = auth.currentUser;
  const check = () => {
    owner(uid, signal);
    if (auth.currentUser !== session)
      throw new Error('The StudyFlow session changed. Connect again.');
  };
  const connection = doc(database, 'users', uid, 'ctuConnections', 'current');
  // Server preflight: never queue an import offline for a later account session.
  await getDocFromServer(connection);
  const result = await runTransaction(database, async (tx) => {
    const previous = await tx.get(connection);
    const refs = rows.map((row) => doc(database, 'users', uid, 'ctuItems', row.id));
    const existing = await Promise.all(refs.map((ref) => tx.get(ref)));
    check();
    const current = previous.exists() ? parseCtuConnection(previous.data()) : null;
    const capturedAt = Timestamp.fromDate(new Date(snapshot.capturedAt));
    if (current && current.capturedAt.toMillis() > capturedAt.toMillis())
      throw new Error('A newer CTU collection is already saved. Refresh before trying again.');
    const counts = { added: 0, updated: 0, unchanged: 0 };
    rows.forEach((row, index) => {
      const found = existing[index]!;
      const old = found.exists() ? parseCtuItem(row.id, found.data()) : null;
      const input = ctuInput(row);
      if (old && JSON.stringify(ctuInput(old)) === JSON.stringify(input)) {
        counts.unchanged++;
        return;
      }
      const oldDue = old ? old.dueDate + (old.dueTime ? 'T' + old.dueTime : '') : '';
      const newDue = row.dueDate + (row.dueTime ? 'T' + row.dueTime : '');
      tx.set(refs[index]!, {
        ...input,
        previousDue: old && oldDue !== newDue ? oldDue : (old?.previousDue ?? ''),
        createdAt: old?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (old) counts.updated++;
      else counts.added++;
    });
    const warnings = snapshot.warnings
      .filter((w) => w !== 'No records have been saved to your planner.')
      .join(' | ');
    const data = {
      portalName: snapshot.portalName,
      course: snapshot.course,
      capturedAt,
      coverage: snapshot.coverage.join(' | '),
      warnings,
    };
    const stamp = Timestamp.fromMillis(0);
    parseCtuConnection({ ...data, createdAt: stamp, updatedAt: stamp });
    tx.set(connection, {
      ...data,
      createdAt: current?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return counts;
  });
  check();
  return result;
}
export function watchCtuImports(
  uid: string,
  next: (view: CtuSavedView) => void,
  fail: (error: unknown) => void,
): () => void {
  const { database, auth } = owner(uid);
  let stopped = false;
  let view: CtuSavedView = { ...EMPTY_CTU };
  const loaded = new Set<string>();
  const stops: (() => void)[] = [];
  const stop = () => {
    stopped = true;
    stops.forEach((fn) => fn());
  };
  const error = (reason: unknown) => {
    if (!stopped && auth.currentUser?.uid === uid) {
      stop();
      fail(reason);
    }
  };
  const valid = (metadata: { fromCache: boolean; hasPendingWrites: boolean }) =>
    !stopped && auth.currentUser?.uid === uid && !metadata.fromCache && !metadata.hasPendingWrites;
  stops.push(
    onSnapshot(
      collection(database, 'users', uid, 'ctuItems'),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!valid(snapshot.metadata)) return;
        try {
          view = { ...view, items: snapshot.docs.map((d) => parseCtuItem(d.id, d.data())) };
          loaded.add('items');
          if (loaded.size === 2) next(view);
        } catch (reason) {
          error(reason);
        }
      },
      error,
    ),
  );
  stops.push(
    onSnapshot(
      doc(database, 'users', uid, 'ctuConnections', 'current'),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!valid(snapshot.metadata)) return;
        try {
          view = {
            ...view,
            connection: snapshot.exists() ? parseCtuConnection(snapshot.data()) : null,
          };
          loaded.add('connection');
          if (loaded.size === 2) next(view);
        } catch (reason) {
          error(reason);
        }
      },
      error,
    ),
  );
  return stop;
}
