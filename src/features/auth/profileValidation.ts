import { Timestamp } from 'firebase/firestore';
import {
  PLANNING_TIMEZONE,
  type StudyBudgetMinutes,
  type UserProfile,
} from '@/shared/types/planner';

export const WEEKDAYS = [
  { key: 1, label: 'Monday' },
  { key: 2, label: 'Tuesday' },
  { key: 3, label: 'Wednesday' },
  { key: 4, label: 'Thursday' },
  { key: 5, label: 'Friday' },
  { key: 6, label: 'Saturday' },
  { key: 7, label: 'Sunday' },
] as const;

export interface ProfileInput {
  displayName: string;
  studyBudgetMinutes: StudyBudgetMinutes;
}

export class ProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileValidationError';
  }
}

export function validateDisplayName(value: string): string {
  const name = value.trim();
  if (name.length < 1 || name.length > 80 || /[\r\n\u2028\u2029]/.test(name)) {
    throw new ProfileValidationError('Enter a display name of 1–80 characters on one line.');
  }
  return name;
}

export function defaultStudyBudgets(): StudyBudgetMinutes {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
}

export function validateProfileInput(input: ProfileInput): ProfileInput {
  const displayName = validateDisplayName(input.displayName);
  const budgets: unknown = input.studyBudgetMinutes;
  if (
    !budgets ||
    typeof budgets !== 'object' ||
    Array.isArray(budgets) ||
    Object.keys(budgets).sort().join(',') !== '1,2,3,4,5,6,7'
  ) {
    throw new ProfileValidationError('Provide a study budget for all seven days.');
  }
  for (const { key, label } of WEEKDAYS) {
    const minutes = input.studyBudgetMinutes[key];
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440) {
      throw new ProfileValidationError(`${label} must be a whole number from 0 to 1440 minutes.`);
    }
  }
  return { displayName, studyBudgetMinutes: { ...input.studyBudgetMinutes } };
}

export function parseUserProfile(data: unknown): UserProfile {
  if (!data || typeof data !== 'object')
    throw new ProfileValidationError('The stored profile is invalid.');
  const value = data as Record<string, unknown>;
  if (
    Object.keys(value).sort().join(',') !==
      'createdAt,displayName,studyBudgetMinutes,timezone,updatedAt' ||
    typeof value.displayName !== 'string' ||
    value.timezone !== PLANNING_TIMEZONE ||
    !(value.createdAt instanceof Timestamp) ||
    !(value.updatedAt instanceof Timestamp) ||
    value.updatedAt.toMillis() < value.createdAt.toMillis()
  ) {
    throw new ProfileValidationError(
      'The stored profile is invalid. Contact the project owner; it has not been overwritten.',
    );
  }
  const input = validateProfileInput({
    displayName: value.displayName,
    studyBudgetMinutes: value.studyBudgetMinutes as StudyBudgetMinutes,
  });
  if (input.displayName !== value.displayName)
    throw new ProfileValidationError('The stored display name is invalid.');
  return {
    ...input,
    timezone: PLANNING_TIMEZONE,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function defaultDisplayName(email: string | null): string {
  return (email?.split('@')[0]?.trim() || 'Student').slice(0, 80);
}
