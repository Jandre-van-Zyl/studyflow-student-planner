
export interface StudyBlockItem {
  id: string;
  startAt: Date;
  endAt: Date;
  status: 'Planned' | 'Done' | 'Cancelled';
}

export interface WorkloadSummary {
  allocatedMinutes: number;
  budgetMinutes: number;
  excessMinutes: number;
  isOverloaded: boolean;
  percentageUsed: number;
}

// I use South African time to make sure I'm comparing the correct dates.
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
 * I use this function to work out how many minutes
 * the student has planned for a specific day.
 */
export function calculateDailyAllocation(
  blocks: StudyBlockItem[],
  targetDate: Date
): number {
  // I get the date first so I can compare it with each study block.
  const targetDateKey = getDateKey(targetDate);

  return blocks
    .filter((block) => {
      // I don't count study blocks that were cancelled.
      if (block.status === 'Cancelled') {
        return false;
      }

      // I only count blocks planned for the selected day.
      return getDateKey(block.startAt) === targetDateKey;
    })
    .reduce((total, block) => {
      // I calculate how long each study block lasts in minutes.
      const durationMinutes =
        (block.endAt.getTime() - block.startAt.getTime()) /
        (1000 * 60);

      // I make sure a negative duration doesn't lower the total.
      return total + Math.max(0, durationMinutes);
    }, 0);
}

/**
 * I use this function to check if the student's planned
 * study time is within their daily study budget (FR-12).
 */
export function getWorkloadSummary(
  allocatedMinutes: number,
  budgetMinutes: number
): WorkloadSummary {
  // I make sure the minutes and budget can't be negative.
  const safeAllocated = Math.max(0, allocatedMinutes);
  const safeBudget = Math.max(0, budgetMinutes);

  // I check how many minutes go over the daily budget.
  const excessMinutes = Math.max(
    0,
    safeAllocated - safeBudget
  );

  // If the student goes over their budget, I mark them as overloaded.
  const isOverloaded = excessMinutes > 0;

  // I start at 0 so the percentage still works if the budget is zero.
  let percentageUsed = 0;

  if (safeBudget > 0) {
    // I calculate what percentage of the daily budget is being used.
    percentageUsed = Math.round(
      (safeAllocated / safeBudget) * 100
    );
  } else if (safeAllocated > 0) {
    // If there is no budget but study time is planned, I use 100%.
    percentageUsed = 100;
  }

  // return the results so the dashboard can display the workload.
  return {
    allocatedMinutes: safeAllocated,
    budgetMinutes: safeBudget,
    excessMinutes,
    isOverloaded,
    percentageUsed,
  };
}
