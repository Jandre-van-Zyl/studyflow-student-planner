import { Timestamp } from 'firebase/firestore';
import type { PlannerDocuments, PlannerInput, PlannerKind } from '@/shared/types/planner';
import type { PlanningView } from './planningView';

export const PLANNER_COLLECTIONS = {
  subjects: 'subjects',
  classes: 'classSlots',
  assessments: 'assessments',
  blocks: 'studyBlocks',
} as const;
export type PlannerViewRecord<K extends PlannerKind = PlannerKind> = PlanningView[K][number];
export class PlannerError extends Error {
  constructor(
    public readonly code: 'validation' | 'conflict' | 'duplicate-code' | 'reference' | 'session',
    message: string,
  ) {
    super(message);
    this.name = 'PlannerError';
  }
}
export function plannerErrorMessage(error: unknown) {
  if (error instanceof PlannerError) return error.message;
  return 'Could not confirm the save. Keep your draft, check your connection and retry. If it was already saved, close and reopen the latest record.';
}
function invalid(message: string): never {
  throw new PlannerError('validation', message);
}
export function plannerId(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value))
    invalid('Invalid record reference. Close and reopen the editor.');
  return value;
}
function text(
  value: unknown,
  name: string,
  max: number,
  required = true,
  singleLine = true,
): string {
  if (typeof value !== 'string') invalid(`Enter a valid ${name}.`);
  const trimmed = value.trim();
  if (
    (required && !trimmed) ||
    trimmed.length > max ||
    (singleLine && /[\r\n\u2028\u2029]/.test(trimmed))
  )
    invalid(
      `Enter ${name} ${required ? '1' : '0'}–${max} characters${singleLine ? ' on one line' : ''}.`,
    );
  return trimmed;
}
function choice<T extends string>(value: unknown, values: readonly T[]): T {
  if (!values.includes(value as T)) invalid('Choose one of the available options.');
  return value as T;
}
function bool(value: unknown): boolean {
  if (typeof value !== 'boolean') invalid('Invalid archive state.');
  return value;
}
export function validPlannerDay(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^20\d\d-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value + 'T12:00:00Z')) &&
    new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value
  );
}
export function timestampToSast(value: Timestamp): string {
  return new Date(value.toMillis() + 7200000).toISOString().slice(0, 19) + '+02:00';
}
function timestamp(value: unknown): Timestamp {
  if (
    typeof value !== 'string' ||
    !/^20\d\d-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:00\+02:00$/.test(value) ||
    !validPlannerDay(value.slice(0, 10))
  )
    invalid('Choose a valid date and minute in SAST, between 2000 and 2099.');
  return Timestamp.fromDate(new Date(value));
}
const fields = {
  subjects: ['name', 'code', 'colour', 'archived'],
  classes: [
    'subjectId',
    'weekday',
    'startTime',
    'endTime',
    'activeFrom',
    'activeTo',
    'location',
    'archived',
  ],
  assessments: [
    'subjectId',
    'title',
    'type',
    'description',
    'dueAt',
    'priority',
    'status',
    'remainingMinutes',
    'archived',
  ],
  blocks: ['assessmentId', 'title', 'startAt', 'endAt', 'status'],
} as const;
function exact(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    !keys.every((key) => Object.hasOwn(value, key))
  )
    invalid('The stored record is invalid. Reload or contact the project team.');
  return value as Record<string, unknown>;
}
export function toPlannerInput<K extends PlannerKind>(
  kind: K,
  item: PlannerViewRecord<K>,
): PlannerInput<K> {
  plannerId(item.id);
  if (item.revision !== undefined && !(item.revision instanceof Timestamp))
    invalid('Invalid record revision.');
  const allowed: readonly string[] = [...fields[kind], 'id', 'revision'];
  if (!Object.keys(item).every((key) => allowed.includes(key)))
    invalid('Unexpected record fields.');
  let input: unknown;
  switch (kind) {
    case 'subjects': {
      const v = item as PlannerViewRecord<'subjects'>;
      const code = text(v.code, 'subject code', 20);
      if (!/^[A-Z0-9][A-Z0-9_-]{0,19}$/.test(code))
        invalid('Use 1–20 uppercase letters, digits, hyphens or underscores for the code.');
      input = {
        name: text(v.name, 'subject name', 80),
        code,
        colour: choice(v.colour, ['sky', 'teal', 'amber', 'rose', 'violet', 'indigo']),
        archived: bool(v.archived),
      };
      break;
    }
    case 'classes': {
      const v = item as PlannerViewRecord<'classes'>;
      if (
        !Number.isInteger(v.weekday) ||
        v.weekday < 1 ||
        v.weekday > 7 ||
        !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v.startTime) ||
        !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v.endTime) ||
        v.endTime <= v.startTime ||
        !validPlannerDay(v.activeFrom) ||
        !validPlannerDay(v.activeTo) ||
        v.activeTo < v.activeFrom
      )
        invalid('Choose a weekday, ordered class times and valid active dates (2000–2099).');
      input = {
        subjectId: plannerId(v.subjectId),
        weekday: v.weekday,
        startTime: v.startTime,
        endTime: v.endTime,
        activeFrom: v.activeFrom,
        activeTo: v.activeTo,
        location: text(v.location, 'location', 120, false),
        archived: bool(v.archived),
      };
      break;
    }
    case 'assessments': {
      const v = item as PlannerViewRecord<'assessments'>;
      const status = choice(v.status, ['To Do', 'In Progress', 'Completed']);
      if (
        !Number.isInteger(v.remainingMinutes) ||
        v.remainingMinutes < (status === 'Completed' ? 0 : 1) ||
        v.remainingMinutes > 14400 ||
        (status === 'Completed' && v.remainingMinutes !== 0)
      )
        invalid('Incomplete work needs 1–14400 whole minutes; completed work needs zero.');
      input = {
        subjectId: plannerId(v.subjectId),
        title: text(v.title, 'title', 120),
        type: choice(v.type, ['Assignment', 'Test', 'Exam', 'Project']),
        description: text(v.description, 'notes', 2000, false, false),
        dueAt: timestamp(v.dueAt),
        priority: choice(v.priority, ['High', 'Medium', 'Low']),
        status,
        remainingMinutes: v.remainingMinutes,
        archived: bool(v.archived),
      };
      break;
    }
    case 'blocks': {
      const v = item as PlannerViewRecord<'blocks'>;
      const startAt = timestamp(v.startAt),
        endAt = timestamp(v.endAt),
        minutes = (endAt.toMillis() - startAt.toMillis()) / 60000;
      if (minutes < 15 || minutes > 180 || v.startAt.slice(0, 10) !== v.endAt.slice(0, 10))
        invalid('Choose 15–180 minutes on the same SAST day.');
      input = {
        assessmentId: plannerId(v.assessmentId),
        title: text(v.title, 'study title', 120),
        startAt,
        endAt,
        status: choice(v.status, ['Planned', 'Done', 'Cancelled']),
      };
      break;
    }
  }
  return input as PlannerInput<K>;
}
export function toPlannerView<K extends PlannerKind>(
  kind: K,
  id: string,
  record: PlannerDocuments[K],
): PlannerViewRecord<K> {
  const input = Object.fromEntries(
    fields[kind].map((key) => [key, (record as unknown as Record<string, unknown>)[key]]),
  );
  let value: unknown = { ...input, id, revision: record.updatedAt };
  if (kind === 'assessments') {
    const assessment = record as PlannerDocuments['assessments'];
    value = { ...input, id, revision: record.updatedAt, dueAt: timestampToSast(assessment.dueAt) };
  } else if (kind === 'blocks') {
    const block = record as PlannerDocuments['blocks'];
    value = {
      ...input,
      id,
      revision: record.updatedAt,
      startAt: timestampToSast(block.startAt),
      endAt: timestampToSast(block.endAt),
    };
  }
  return value as PlannerViewRecord<K>;
}
export function parsePlannerRecord<K extends PlannerKind>(
  kind: K,
  value: unknown,
): PlannerDocuments[K] {
  const record = exact(value, [
    ...fields[kind],
    'createdAt',
    'updatedAt',
    ...(kind === 'assessments' ? ['completedAt'] : []),
  ]);
  if (
    !(record.createdAt instanceof Timestamp) ||
    !(record.updatedAt instanceof Timestamp) ||
    record.updatedAt.toMillis() < record.createdAt.toMillis()
  )
    invalid('Invalid stored timestamps.');
  const doc = record as unknown as PlannerDocuments[K];
  const input = toPlannerInput(kind, toPlannerView(kind, 'validate', doc));
  for (const [key, valid] of Object.entries(input)) {
    const stored = record[key];
    if (
      valid instanceof Timestamp
        ? !(stored instanceof Timestamp) || !valid.isEqual(stored)
        : valid !== stored
    )
      invalid('Invalid stored field values.');
  }
  if (kind === 'assessments') {
    if (
      record.status === 'Completed'
        ? !(record.completedAt instanceof Timestamp) ||
          record.completedAt.toMillis() > record.updatedAt.toMillis()
        : record.completedAt !== null
    )
      invalid('Invalid stored completion state.');
  }
  return doc;
}
