import type { Timestamp } from 'firebase/firestore';

export const PLANNING_TIMEZONE = 'Africa/Johannesburg' as const;
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type StudyBudgetMinutes = Record<IsoWeekday, number>;
export type SubjectColour = 'sky' | 'teal' | 'amber' | 'rose' | 'violet' | 'indigo';
export type AssessmentPriority = 'High' | 'Medium' | 'Low';
export type AssessmentStatus = 'To Do' | 'In Progress' | 'Completed';
export type AssessmentType = 'Assignment' | 'Test' | 'Exam' | 'Project';
export type StudyBlockStatus = 'Planned' | 'Done' | 'Cancelled';

// Persisted document shapes. IDs come from DocumentSnapshot.id, not editable owner fields.
interface Timestamps {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile extends Timestamps {
  displayName: string;
  timezone: typeof PLANNING_TIMEZONE;
  studyBudgetMinutes: StudyBudgetMinutes;
}

export interface Subject extends Timestamps {
  name: string;
  code: string;
  colour: SubjectColour;
  archived: boolean;
}

export interface ClassSlot extends Timestamps {
  subjectId: string;
  weekday: IsoWeekday;
  startTime: string; // HH:mm, local SAST wall time.
  endTime: string; // HH:mm; same day, after startTime.
  activeFrom: string; // YYYY-MM-DD, inclusive.
  activeTo: string; // YYYY-MM-DD, inclusive.
  location: string;
  archived: boolean;
}

export interface Assessment extends Timestamps {
  subjectId: string;
  title: string;
  type: AssessmentType;
  description: string;
  dueAt: Timestamp;
  priority: AssessmentPriority;
  status: AssessmentStatus;
  remainingMinutes: number;
  archived: boolean;
  completedAt: Timestamp | null;
}

export interface StudyBlock extends Timestamps {
  assessmentId: string;
  title: string;
  startAt: Timestamp;
  endAt: Timestamp;
  status: StudyBlockStatus;
}

export type WithId<T> = T & { id: string };
