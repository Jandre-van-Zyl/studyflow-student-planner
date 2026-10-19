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
import type { PlannerDocuments, PlannerInput, PlannerKind } from '@/shared/types/planner';
import { EMPTY_VIEW, type PlanningView } from './planningView';
import {
  PLANNER_COLLECTIONS,
  PlannerError,
  parsePlannerRecord,
  plannerId,
  toPlannerInput,
  toPlannerView,
  type PlannerViewRecord,
} from './plannerContract';

function ownPlanner(uid: string) {
  const services = getFirebaseServices();
  if (!uid || services.auth.currentUser?.uid !== uid)
    throw new PlannerError('session', 'A current signed-in owner is required. Sign in again.');
  return services;
}
const conflict = () =>
  new PlannerError(
    'conflict',
    'This record changed in another session. Your draft is retained. Close and reopen the record to load its latest version before saving.',
  );

export function watchPlanner(
  uid: string,
  next: (data: PlanningView) => void,
  fail: (error: unknown) => void,
): () => void {
  const { auth, database } = ownPlanner(uid);
  let stopped = false;
  const stops: (() => void)[] = [];
  const loaded = new Set<PlannerKind>();
  let data: PlanningView = { ...EMPTY_VIEW };
  const stop = () => {
    stopped = true;
    stops.forEach((dispose) => dispose());
  };
  const failed = (error: unknown) => {
    if (!stopped && auth.currentUser?.uid === uid) {
      stop();
      fail(error);
    }
  };
  for (const kind of Object.keys(PLANNER_COLLECTIONS) as PlannerKind[]) {
    stops.push(
      onSnapshot(
        collection(database, 'users', uid, PLANNER_COLLECTIONS[kind]),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (
            stopped ||
            auth.currentUser?.uid !== uid ||
            snapshot.metadata.fromCache ||
            snapshot.metadata.hasPendingWrites
          )
            return;
          try {
            const records = snapshot.docs.map((entry) =>
              toPlannerView(kind, entry.id, parsePlannerRecord(kind, entry.data())),
            );
            data = { ...data, [kind]: records };
            loaded.add(kind);
            if (loaded.size === 4) next(data);
          } catch (error) {
            failed(error);
          }
        },
        failed,
      ),
    );
  }
  return stop;
}

export async function savePlannerRecord<K extends PlannerKind>(
  uid: string,
  kind: K,
  item: PlannerViewRecord<K>,
): Promise<PlannerViewRecord<K>> {
  const input = toPlannerInput(kind, item);
  const { auth, database } = ownPlanner(uid);
  const ref = doc(database, 'users', uid, PLANNER_COLLECTIONS[kind], plannerId(item.id));
  // Transactions must not become offline queued writes. Re-read for concurrency inside.
  await getDocFromServer(ref);
  await runTransaction(database, async (tx) => {
    const snapshot = await tx.get(ref);
    if (auth.currentUser?.uid !== uid)
      throw new PlannerError('session', 'The account changed before saving. Sign in again.');
    const current = snapshot.exists() ? parsePlannerRecord(kind, snapshot.data()) : null;
    if (current) {
      if (!item.revision) {
        const previous = toPlannerInput(kind, toPlannerView(kind, item.id, current));
        const same = Object.entries(input).every(([key, value]) => {
          const old = (previous as Record<string, unknown>)[key];
          return value instanceof Timestamp
            ? old instanceof Timestamp && value.isEqual(old)
            : value === old;
        });
        if (same) return; // Retry of this exact stable-ID creation after uncertain acknowledgement.
        throw conflict();
      }
      if (!current.updatedAt.isEqual(item.revision)) throw conflict();
    } else if (item.revision) throw conflict();

    let claim: ReturnType<typeof doc> | null = null;
    let oldCode: string | null = null;
    if (kind === 'subjects') {
      const subject = input as ReturnType<typeof toPlannerInput<'subjects'>>;
      claim = doc(database, 'users', uid, 'subjectCodes', subject.code);
      const claimed = await tx.get(claim);
      if (claimed.exists() && claimed.data().subjectId !== item.id)
        throw new PlannerError(
          'duplicate-code',
          'That subject code already exists, including archived subjects. Edit or restore it instead.',
        );
      oldCode = current ? (current as PlannerDocuments['subjects']).code : null;
      if (oldCode === subject.code && claimed.exists()) claim = null;
    } else if (kind === 'classes' || kind === 'assessments') {
      const linked = input as PlannerInput<'classes'>;
      const subject = await tx.get(doc(database, 'users', uid, 'subjects', linked.subjectId));
      const unchanged =
        current && (current as PlannerDocuments['classes']).subjectId === linked.subjectId;
      if (
        !subject.exists() ||
        (!unchanged && parsePlannerRecord('subjects', subject.data()).archived)
      )
        throw new PlannerError(
          'reference',
          'Choose an active subject. The previous subject may have been archived.',
        );
    } else {
      const linked = input as ReturnType<typeof toPlannerInput<'blocks'>>;
      const assessmentSnapshot = await tx.get(
        doc(database, 'users', uid, 'assessments', linked.assessmentId),
      );
      if (!assessmentSnapshot.exists())
        throw new PlannerError(
          'reference',
          'The linked assessment is unavailable. Choose another assessment.',
        );
      const assessment = parsePlannerRecord('assessments', assessmentSnapshot.data());
      const subjectSnapshot = await tx.get(
        doc(database, 'users', uid, 'subjects', assessment.subjectId),
      );
      const unchanged =
        current && (current as PlannerDocuments['blocks']).assessmentId === linked.assessmentId;
      if (
        !subjectSnapshot.exists() ||
        (!unchanged &&
          (assessment.archived ||
            assessment.status === 'Completed' ||
            parsePlannerRecord('subjects', subjectSnapshot.data()).archived))
      )
        throw new PlannerError(
          'reference',
          'Choose an incomplete assessment in an active subject.',
        );
      if (linked.status === 'Done' && linked.startAt.toMillis() > Date.now())
        throw new PlannerError(
          'validation',
          'A future study block cannot be marked done before its start time.',
        );
    }
    const completion =
      kind === 'assessments'
        ? {
            completedAt:
              (input as PlannerInput<'assessments'>).status === 'Completed'
                ? current && (current as PlannerDocuments['assessments']).status === 'Completed'
                  ? (current as PlannerDocuments['assessments']).completedAt
                  : serverTimestamp()
                : null,
          }
        : {};
    if (claim) tx.set(claim, { subjectId: item.id });
    if (kind === 'subjects' && oldCode && oldCode !== (input as PlannerInput<'subjects'>).code)
      tx.delete(doc(database, 'users', uid, 'subjectCodes', oldCode));
    tx.set(ref, {
      ...input,
      ...completion,
      createdAt: current?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  // Do not acknowledge the older view of an active document listener.
  const confirmed = await runTransaction(database, (tx) => tx.get(ref));
  if (auth.currentUser?.uid !== uid)
    throw new PlannerError('session', 'The account changed before save confirmation.');
  if (!confirmed.exists()) throw new Error('Save could not be confirmed.');
  return toPlannerView(kind, item.id, parsePlannerRecord(kind, confirmed.data()));
}
