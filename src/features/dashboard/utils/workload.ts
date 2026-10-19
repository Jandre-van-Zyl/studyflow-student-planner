import type { StudyBlockStatus } from '../../../shared/types/planner';

export interface StudyBlockItem {
  id: string;
  startAt: Date;
  endAt: Date;
  status: StudyBlockStatus;
}

export interface WorkloadSummary {
  allocatedMinutes: number;
  budgetMinutes: number;
  excessMinutes: number;
  isOverloaded: boolean;
  percentageUsed: number;
}

/**
 * These calculation functions use JavaScript Date objects.
 *
 * When reading saved Firebase Timestamp values, convert them with
 * timestamp.toDate() at the data-mapping boundary.
 *
 * When reading ISO date strings from screen data, parse them with
 * new Date(dateString). Include the timezone offset in the string
 * so the correct instant is used.
 *
 * Dates are compared using South African calendar days.
 */
function getDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

/**
 * Calculates the total minutes allocated to a South African calendar day.
 * Planned and Done blocks count; Cancelled blocks do not.
 */
export function calculateDailyAllocation(blocks: StudyBlockItem[], targetDate: Date): number {
  const targetDateKey = getDateKey(targetDate);

  return blocks
    .filter((block) => {
      if (block.status === 'Cancelled') {
        return false;
      }

      return getDateKey(block.startAt) === targetDateKey;
    })
    .reduce((total, block) => {
      const durationMinutes = (block.endAt.getTime() - block.startAt.getTime()) / (1000 * 60);

      return total + Math.max(0, durationMinutes);
    }, 0);
}

/**
 * Checks whether planned study time is within the daily budget (FR-12).
 */
export function getWorkloadSummary(
  allocatedMinutes: number,
  budgetMinutes: number,
): WorkloadSummary {
  const safeAllocated = Math.max(0, allocatedMinutes);
  const safeBudget = Math.max(0, budgetMinutes);

  const excessMinutes = Math.max(0, safeAllocated - safeBudget);
  const isOverloaded = excessMinutes > 0;

  let percentageUsed = 0;

  if (safeBudget > 0) {
    percentageUsed = Math.round((safeAllocated / safeBudget) * 100);
  } else if (safeAllocated > 0) {
    percentageUsed = 100;
  }

  return {
    allocatedMinutes: safeAllocated,
    budgetMinutes: safeBudget,
    excessMinutes,
    isOverloaded,
    percentageUsed,
  };
}
