import { Timestamp } from 'firebase/firestore';
import { plannerId } from '@/features/planner/plannerContract';
import type { Assessment } from '@/shared/types/planner';
import type { CtuItem } from './ctuImportContract';

// Source observations and personal planner choices have separate ownership.
export interface CtuPlannerLink {
  id: string;
  assessmentId: string;
  appliedTitle: string;
  appliedDue: Timestamp;
  sourceRevision: Timestamp;
  conflict: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
export function parseCtuPlannerLink(id: string, value: unknown): CtuPlannerLink {
  const keys = [
    'assessmentId',
    'appliedTitle',
    'appliedDue',
    'sourceRevision',
    'conflict',
    'createdAt',
    'updatedAt',
  ];
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid CTU planning link.');
  const d = value as Record<string, unknown>;
  if (
    !/^[a-f0-9]{64}$/.test(id) ||
    Object.keys(d).length !== keys.length ||
    keys.some((k) => !Object.hasOwn(d, k)) ||
    d.assessmentId !== `ctu-${id}` ||
    typeof d.appliedTitle !== 'string' ||
    !d.appliedTitle.trim() ||
    d.appliedTitle !== d.appliedTitle.trim() ||
    /[\r\n\u2028\u2029]/.test(d.appliedTitle) ||
    d.appliedTitle.length > 120 ||
    typeof d.conflict !== 'boolean' ||
    !['appliedDue', 'sourceRevision', 'createdAt', 'updatedAt'].every(
      (k) => d[k] instanceof Timestamp,
    ) ||
    (d.updatedAt as Timestamp).toMillis() < (d.createdAt as Timestamp).toMillis()
  )
    throw new Error('Invalid CTU planning link.');
  plannerId(d.assessmentId);
  const due = d.appliedDue as Timestamp;
  const year = new Date(due.toMillis() + 7200000).getUTCFullYear();
  if (due.nanoseconds !== 0 || due.seconds % 60 !== 0 || year < 2000 || year > 2099)
    throw new Error('Invalid CTU planning time.');
  return { id, ...d } as unknown as CtuPlannerLink;
}
export function reconcileCtuAssessment(
  source: CtuItem,
  assessment: Assessment,
  link: CtuPlannerLink,
) {
  // Date-only sources retain the student's explicitly chosen planning time.
  const localTime = new Date(link.appliedDue.toMillis() + 7200000).toISOString().slice(11, 16);
  const dueAt = Timestamp.fromDate(
    new Date(`${source.dueDate}T${source.dueTime || localTime}:00+02:00`),
  );
  const title = source.title.slice(0, 120);
  const titleOwned = assessment.title === link.appliedTitle || assessment.title === title;
  const dueOwned = assessment.dueAt.isEqual(link.appliedDue) || assessment.dueAt.isEqual(dueAt);
  const next = {
    ...assessment,
    title: titleOwned ? title : assessment.title,
    dueAt: dueOwned ? dueAt : assessment.dueAt,
  };
  return {
    assessment: next,
    appliedTitle: titleOwned ? title : link.appliedTitle,
    appliedDue: dueOwned ? dueAt : link.appliedDue,
    conflict:
      (!titleOwned && assessment.title !== title) ||
      (!dueOwned && !assessment.dueAt.isEqual(dueAt)),
    changed: assessment.title !== next.title || !assessment.dueAt.isEqual(next.dueAt),
  };
}
