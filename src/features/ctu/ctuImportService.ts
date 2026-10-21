import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase/client';
import { parsePortalSnapshot } from './portalContract';
import { refreshCtuPlans } from './ctuPlanningService';
import { parseCtuPlannerLink } from './ctuPlanningContract';
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
export function ctuSaveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.startsWith('CTU changed a source identifier.'))
    return error.message;
  return 'CTU information was collected but the source and planner update were not fully confirmed. Retry saving while signed into this account.';
}
export async function saveCtuImport(
  uid: string,
  value: unknown,
  signal?: AbortSignal,
): Promise<{ added: number; updated: number; unchanged: number }> {
  return saveCtuImportAttempt(uid, value, signal, 0);
}
class ConcurrentCtuSync extends Error {}
async function saveCtuImportAttempt(
  uid: string,
  value: unknown,
  signal: AbortSignal | undefined,
  attempt: number,
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
  const observedConnection = await getDocFromServer(connection);
  const known = await getDocsFromServer(collection(database, 'users', uid, 'ctuItems'));
  check();
  const previousItems = known.docs.map((d) => parseCtuItem(d.id, d.data()));
  for (const row of rows) {
    if (
      [...previousItems, ...rows].some(
        (old) =>
          old.id !== row.id &&
          old.kind === row.kind &&
          old.portalName === row.portalName &&
          old.course === row.course &&
          old.module === row.module &&
          old.title === row.title &&
          (!old.sourceId || !row.sourceId) &&
          old.url === row.url,
      )
    )
      throw new Error(
        'CTU changed a source identifier. The existing item was kept; this sync needs reconciliation before saving to avoid a duplicate.',
      );
  }
  let result;
  try {
    result = await runTransaction(database, async (tx) => {
      const previous = await tx.get(connection);
      if (
        previous.exists() !== observedConnection.exists() ||
        (previous.exists() &&
          !parseCtuConnection(previous.data()).updatedAt.isEqual(
            parseCtuConnection(observedConnection.data()).updatedAt,
          ))
      )
        throw new ConcurrentCtuSync('Another sync finished. Retry this collection.');
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
        observedIds: rows
          .map((row) => row.id)
          .sort()
          .join(','),
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
  } catch (reason) {
    if (reason instanceof ConcurrentCtuSync && attempt < 3)
      return saveCtuImportAttempt(uid, value, signal, attempt + 1);
    throw reason;
  }
  check();
  await refreshCtuPlans(uid, signal);
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
          if (loaded.size === 3) next(view);
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
          if (loaded.size === 3) next(view);
        } catch (reason) {
          error(reason);
        }
      },
      error,
    ),
  );
  stops.push(
    onSnapshot(
      collection(database, 'users', uid, 'ctuPlannerLinks'),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!valid(snapshot.metadata)) return;
        try {
          view = { ...view, links: snapshot.docs.map((d) => parseCtuPlannerLink(d.id, d.data())) };
          loaded.add('links');
          if (loaded.size === 3) next(view);
        } catch (reason) {
          error(reason);
        }
      },
      error,
    ),
  );
  return stop;
}
