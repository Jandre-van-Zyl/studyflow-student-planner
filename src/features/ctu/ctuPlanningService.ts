import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase/client';
import { parsePlannerRecord, toPlannerInput } from '@/features/planner/plannerContract';
import { savePlannerRecord } from '@/features/planner/plannerService';
import type { AssessmentPriority, AssessmentType } from '@/shared/types/planner';
import { parseCtuItem } from './ctuImportContract';
import { parseCtuPlannerLink, reconcileCtuAssessment } from './ctuPlanningContract';

function sessionFor(uid: string, signal?: AbortSignal) {
  const services = getFirebaseServices();
  const user = services.auth.currentUser;
  const check = () => {
    if (!uid || !user || user.uid !== uid || services.auth.currentUser !== user || signal?.aborted)
      throw new Error('The StudyFlow session changed. Try again from your account.');
  };
  check();
  return { ...services, check };
}
export interface CtuPlanningChoices {
  subjectId: string;
  type: AssessmentType;
  priority: AssessmentPriority;
  remainingMinutes: number;
  planningTime: string;
  completed?: boolean;
}
export async function planCtuAssessment(
  uid: string,
  sourceId: string,
  choices: CtuPlanningChoices,
  signal?: AbortSignal,
) {
  if (!/^[a-f0-9]{64}$/.test(sourceId)) throw new Error('Invalid CTU source.');
  const { database, check } = sessionFor(uid, signal);
  const sourceRef = doc(database, 'users', uid, 'ctuItems', sourceId);
  const linkRef = doc(database, 'users', uid, 'ctuPlannerLinks', sourceId);
  const existingLink = await getDocFromServer(linkRef);
  check();
  if (existingLink.exists()) {
    if (choices.completed)
      throw new Error(
        'This assignment is already in your planner. Reload and mark it complete there.',
      );
    return parseCtuPlannerLink(sourceId, existingLink.data()).assessmentId;
  }
  const first = await getDocFromServer(sourceRef);
  if (!first.exists()) throw new Error('Sync this CTU assessment first.');
  const initial = parseCtuItem(sourceId, first.data());
  if (initial.kind !== 'assessment') throw new Error('Choose a CTU assessment.');
  if (choices.completed && (initial.upload !== 'seen' || choices.type !== 'Assignment'))
    throw new Error('Sync an uploaded assignment before marking it complete.');
  const id = `ctu-${sourceId}`;
  // Validate all planning choices before creating even the optional module record.
  const draft = {
    id,
    subjectId: choices.subjectId || 'pending-module',
    title: initial.title.slice(0, 120),
    type: choices.type,
    priority: choices.priority,
    status: choices.completed ? ('Completed' as const) : ('To Do' as const),
    remainingMinutes: choices.completed ? 0 : choices.remainingMinutes,
    archived: false,
    description: `Imported from CTU: ${initial.module}\nSource title: ${initial.title}\n${initial.dueTime ? 'Portal wall time interpreted in SAST for planning.' : 'CTU supplied a date only; the time is your planning target.'}`,
    dueAt: `${initial.dueDate}T${initial.dueTime || choices.planningTime}:00+02:00`,
  };
  toPlannerInput('assessments', draft);
  check();
  let subjectId = choices.subjectId;
  if (!subjectId) {
    const identity = JSON.stringify([initial.portalName, initial.course, initial.module]);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity));
    const hash = Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, '0')).join(
      '',
    );
    subjectId = `ctu-${hash}`;
    const subject = await getDocFromServer(doc(database, 'users', uid, 'subjects', subjectId));
    check();
    if (!subject.exists())
      await savePlannerRecord(uid, 'subjects', {
        id: subjectId,
        name: initial.module.slice(0, 80),
        code: `CTU-${hash.slice(0, 16).toUpperCase()}`,
        colour: 'teal',
        archived: false,
      });
  }
  const targetRef = doc(database, 'users', uid, 'assessments', id);
  await runTransaction(database, async (tx) => {
    const [sourceSnap, linkSnap, targetSnap, subjectSnap] = await Promise.all([
      tx.get(sourceRef),
      tx.get(linkRef),
      tx.get(targetRef),
      tx.get(doc(database, 'users', uid, 'subjects', subjectId)),
    ]);
    check();
    if (linkSnap.exists()) {
      parseCtuPlannerLink(sourceId, linkSnap.data());
      if (choices.completed)
        throw new Error(
          'This assignment was just added to your planner. Reload before marking it complete.',
        );
      return; // Repeated or concurrent activation never resets student progress.
    }
    if (targetSnap.exists())
      throw new Error('A planner record already uses this source. Reload before retrying.');
    if (
      !sourceSnap.exists() ||
      !subjectSnap.exists() ||
      parsePlannerRecord('subjects', subjectSnap.data()).archived
    )
      throw new Error('Choose an active subject and sync CTU again.');
    const source = parseCtuItem(sourceId, sourceSnap.data());
    if (choices.completed && source.upload !== 'seen')
      throw new Error('The uploaded file is no longer confirmed. Sync CTU and retry.');
    if (!source.updatedAt.isEqual(initial.updatedAt))
      throw new Error('CTU changed while you were planning. Reopen this item.');
    const input = toPlannerInput('assessments', { ...draft, subjectId });
    tx.set(targetRef, {
      ...input,
      completedAt: choices.completed ? serverTimestamp() : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    tx.set(linkRef, {
      assessmentId: id,
      appliedTitle: input.title,
      appliedDue: input.dueAt,
      sourceRevision: source.updatedAt,
      conflict: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  check();
  return id;
}

export async function refreshCtuPlans(uid: string, signal?: AbortSignal) {
  const { database, check } = sessionFor(uid, signal);
  const links = await getDocsFromServer(collection(database, 'users', uid, 'ctuPlannerLinks'));
  // One bounded transaction per linked assessment avoids Firestore's cross-document rule limits.
  for (const entry of links.docs) {
    check();
    const initial = parseCtuPlannerLink(entry.id, entry.data());
    const sourceRef = doc(database, 'users', uid, 'ctuItems', entry.id);
    const targetRef = doc(database, 'users', uid, 'assessments', initial.assessmentId);
    await runTransaction(database, async (tx) => {
      const [sourceSnap, targetSnap, linkSnap] = await Promise.all([
        tx.get(sourceRef),
        tx.get(targetRef),
        tx.get(entry.ref),
      ]);
      check();
      if (!sourceSnap.exists() || !targetSnap.exists() || !linkSnap.exists())
        throw new Error('A CTU planning link needs attention.');
      const source = parseCtuItem(entry.id, sourceSnap.data());
      const link = parseCtuPlannerLink(entry.id, linkSnap.data());
      const assessment = parsePlannerRecord('assessments', targetSnap.data());
      const result = reconcileCtuAssessment(source, assessment, link);
      if (
        link.sourceRevision.isEqual(source.updatedAt) &&
        !result.changed &&
        link.conflict === result.conflict &&
        link.appliedTitle === result.appliedTitle &&
        link.appliedDue.isEqual(result.appliedDue)
      )
        return;
      if (result.changed) tx.set(targetRef, { ...result.assessment, updatedAt: serverTimestamp() });
      tx.set(entry.ref, {
        assessmentId: link.assessmentId,
        appliedTitle: result.appliedTitle,
        appliedDue: result.appliedDue,
        sourceRevision: source.updatedAt,
        conflict: result.conflict,
        createdAt: link.createdAt,
        updatedAt: serverTimestamp(),
      });
    });
  }
  check();
}
