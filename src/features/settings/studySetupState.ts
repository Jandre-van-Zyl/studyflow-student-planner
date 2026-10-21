import type { UserProfile } from '@/shared/types/planner';

// A confirmed profile save advances updatedAt, including an intentional zero budget.
export function needsStudySetup(profile: UserProfile): boolean {
  return (
    profile.createdAt.isEqual(profile.updatedAt) &&
    Object.values(profile.studyBudgetMinutes).every((minutes) => minutes === 0)
  );
}
