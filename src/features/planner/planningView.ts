import type {
  Assessment,
  ClassSlot,
  StudyBlock,
  Subject,
  StudyBudgetMinutes,
} from '@/shared/types/planner';
import type { Timestamp } from 'firebase/firestore';
import { getRecommendedTasks } from '@/features/dashboard/utils/priority';
import { calculateDailyAllocation } from '@/features/dashboard/utils/workload';

// UI adapters keep date strings separate from persisted Firebase Timestamp contracts.
type LocalRecord<T> = Omit<T, 'createdAt' | 'updatedAt'> & { id: string; revision?: Timestamp };
export type ViewSubject = LocalRecord<Subject>;
export type ViewClass = LocalRecord<ClassSlot>;
export type ViewAssessment = Omit<LocalRecord<Assessment>, 'dueAt' | 'completedAt'> & {
  dueAt: string;
};
export type ViewBlock = Omit<LocalRecord<StudyBlock>, 'startAt' | 'endAt'> & {
  startAt: string;
  endAt: string;
};
export interface PlanningView {
  subjects: ViewSubject[];
  classes: ViewClass[];
  assessments: ViewAssessment[];
  blocks: ViewBlock[];
}
export interface AgendaItem {
  id: string;
  kind: 'Class' | 'Study' | 'Deadline';
  title: string;
  start: string;
  end?: string;
  subjectId: string;
  detail: string;
}
export const EMPTY_VIEW: PlanningView = { subjects: [], classes: [], assessments: [], blocks: [] };
export const ZERO_BUDGETS: StudyBudgetMinutes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
export function sastDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function addDays(day: string, amount: number) {
  const date = new Date(day + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function weekday(day: string) {
  return (new Date(day + 'T12:00:00Z').getUTCDay() || 7) as keyof StudyBudgetMinutes;
}
export function monday(day: string) {
  return addDays(day, 1 - weekday(day));
}
export function displayDay(
  day: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
) {
  return new Intl.DateTimeFormat('en-ZA', { ...options, timeZone: 'Africa/Johannesburg' }).format(
    new Date(day + 'T12:00:00Z'),
  );
}
export function displayDue(due: string) {
  return displayDay(due.slice(0, 10)) + ', ' + due.slice(11, 16);
}
export function duration(start: string, end: string) {
  return (Date.parse(end) - Date.parse(start)) / 60000;
}
export function overlaps(start: string, end: string, otherStart: string, otherEnd: string) {
  return start < otherEnd && end > otherStart;
}
export function blockDetail(data: PlanningView, block: ViewBlock) {
  const assessment = data.assessments.find((a) => a.id === block.assessmentId);
  const subject = data.subjects.find((s) => s.id === assessment?.subjectId);
  return [
    block.status,
    assessment?.status === 'Completed' ? 'Assessment completed' : '',
    assessment?.archived ? 'Assessment archived' : '',
    subject?.archived ? 'Subject archived' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
export function agendaForDay(data: PlanningView, day: string): AgendaItem[] {
  const activeSubject = (id: string) =>
    data.subjects.some((subject) => subject.id === id && !subject.archived);
  return [
    ...data.classes
      .filter(
        (slot) =>
          !slot.archived &&
          activeSubject(slot.subjectId) &&
          slot.weekday === weekday(day) &&
          slot.activeFrom <= day &&
          slot.activeTo >= day,
      )
      .map((slot): AgendaItem => ({
        id: slot.id,
        kind: 'Class',
        title: data.subjects.find((s) => s.id === slot.subjectId)?.name ?? 'Class',
        start: day + 'T' + slot.startTime + ':00+02:00',
        end: day + 'T' + slot.endTime + ':00+02:00',
        subjectId: slot.subjectId,
        detail: slot.location || 'No location set',
      })),
    ...data.blocks
      .filter((block) => block.status !== 'Cancelled' && block.startAt.slice(0, 10) === day)
      .map((block): AgendaItem => ({
        id: block.id,
        kind: 'Study',
        title: block.title,
        start: block.startAt,
        end: block.endAt,
        subjectId: data.assessments.find((a) => a.id === block.assessmentId)?.subjectId ?? '',
        detail: blockDetail(data, block),
      })),
    ...data.assessments
      .filter(
        (item) => !item.archived && item.status !== 'Completed' && item.dueAt.slice(0, 10) === day,
      )
      .map((item): AgendaItem => ({
        id: item.id,
        kind: 'Deadline',
        title: item.title,
        start: item.dueAt,
        subjectId: item.subjectId,
        detail: item.priority + ' priority',
      })),
  ].sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}
export function blockConflicts(data: PlanningView, block: ViewBlock) {
  return agendaForDay(data, block.startAt.slice(0, 10)).filter(
    (item) =>
      !(item.kind === 'Study' && item.id === block.id) &&
      item.end &&
      overlaps(block.startAt, block.endAt, item.start, item.end),
  );
}
export function validateBlock(block: ViewBlock) {
  const amount = duration(block.startAt, block.endAt);
  if (
    !Number.isFinite(amount) ||
    block.startAt.slice(0, 10) !== block.endAt.slice(0, 10) ||
    amount < 15 ||
    amount > 180
  )
    return 'Choose 15–180 minutes on the same SAST day, with the end after the start.';
  if (!block.title.trim() || !block.assessmentId)
    return 'Choose an assessment and enter a study title.';
  return null;
}
export function allocation(data: PlanningView, day: string) {
  return calculateDailyAllocation(
    data.blocks.map((block) => ({
      ...block,
      startAt: new Date(block.startAt),
      endAt: new Date(block.endAt),
    })),
    new Date(day + 'T00:00:00+02:00'),
  );
}
export function completion(data: PlanningView) {
  const items = data.assessments.filter((item) => !item.archived);
  const done = items.filter((item) => item.status === 'Completed').length;
  return {
    total: items.length,
    done,
    percent: items.length ? Math.round((done / items.length) * 100) : 0,
    remaining: items
      .filter((item) => item.status !== 'Completed')
      .reduce((sum, item) => sum + item.remainingMinutes, 0),
  };
}
export function rankedAssessments(data: PlanningView, now = Date.now()) {
  const sourceById = new Map(data.assessments.map((item) => [item.id, item]));
  return getRecommendedTasks(
    data.assessments.map((item) => ({ ...item, dueAt: new Date(item.dueAt) })),
    new Date(now),
  ).map(({ assessment, explanation, isQuickTask }) => ({
    // Collection IDs are unique; keep the original SAST strings and revision metadata.
    item: sourceById.get(assessment.id)!,
    reason: explanation,
    isQuickTask,
  }));
}
export function exampleView(): PlanningView {
  return {
    subjects: [
      { id: 'se2', name: 'Software Engineering 2', code: 'SE2', colour: 'teal', archived: false },
      { id: 'prog', name: 'Programming', code: 'PROG', colour: 'sky', archived: false },
    ],
    classes: [
      {
        id: 'class-se2',
        subjectId: 'se2',
        weekday: 1,
        startTime: '10:00',
        endTime: '11:00',
        activeFrom: '2026-10-19',
        activeTo: '2026-11-30',
        location: 'Room 204',
        archived: false,
      },
    ],
    assessments: [
      {
        id: 'requirements',
        subjectId: 'se2',
        title: 'Requirements draft',
        type: 'Assignment',
        description: 'Review requirements and prepare the first draft.',
        dueAt: '2026-10-20T12:00:00+02:00',
        priority: 'High',
        status: 'To Do',
        remainingMinutes: 90,
        archived: false,
      },
      {
        id: 'quiz',
        subjectId: 'prog',
        title: 'Revision quiz',
        type: 'Test',
        description: 'Practise the revision questions.',
        dueAt: '2026-10-22T09:00:00+02:00',
        priority: 'Medium',
        status: 'In Progress',
        remainingMinutes: 45,
        archived: false,
      },
      {
        id: 'design',
        subjectId: 'se2',
        title: 'Design exercise',
        type: 'Assignment',
        description: '',
        dueAt: '2026-10-15T12:00:00+02:00',
        priority: 'Low',
        status: 'Completed',
        remainingMinutes: 0,
        archived: false,
      },
    ],
    blocks: [
      {
        id: 'block-requirements',
        assessmentId: 'requirements',
        title: 'Draft the requirements',
        startAt: '2026-10-19T09:00:00+02:00',
        endAt: '2026-10-19T09:45:00+02:00',
        status: 'Planned',
      },
      {
        id: 'block-quiz',
        assessmentId: 'quiz',
        title: 'Practise revision questions',
        startAt: '2026-10-19T14:00:00+02:00',
        endAt: '2026-10-19T14:45:00+02:00',
        status: 'Planned',
      },
    ],
  };
}
