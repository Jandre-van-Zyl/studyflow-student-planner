import { describe, it, expect } from 'vitest';
import { calculateDailyAllocation, getWorkloadSummary, type StudyBlockItem } from './workload';

describe('FR-12 Daily Workload Calculations', () => {
  // I use the same date for my tests so the results are consistent.
  const targetDate = new Date('2026-10-15T00:00:00+02:00');

  it('TC-26: two 45-minute blocks produce 90 allocated minutes and 30 excess minutes', () => {
    const blocks: StudyBlockItem[] = [
      {
        id: 'b1',
        startAt: new Date('2026-10-15T10:00:00+02:00'),
        endAt: new Date('2026-10-15T10:45:00+02:00'),
        status: 'Planned',
      },
      {
        id: 'b2',
        startAt: new Date('2026-10-15T14:00:00+02:00'),
        endAt: new Date('2026-10-15T14:45:00+02:00'),
        status: 'Done',
      },
      {
        id: 'b3-cancelled',
        startAt: new Date('2026-10-15T16:00:00+02:00'),
        endAt: new Date('2026-10-15T17:00:00+02:00'),
        status: 'Cancelled',
      },
    ];

    // I add up the study time for this day.
    const allocated = calculateDailyAllocation(blocks, targetDate);

    // The two 45-minute blocks count, but the cancelled one doesn't.
    expect(allocated).toBe(90);

    // I check what happens when the student has a 60-minute daily budget.
    const summary = getWorkloadSummary(allocated, 60);

    expect(summary.allocatedMinutes).toBe(90);
    expect(summary.budgetMinutes).toBe(60);

    // The student planned 30 minutes more than their budget.
    expect(summary.excessMinutes).toBe(30);
    expect(summary.isOverloaded).toBe(true);
  });

  it('TC-27: handles zero budget without NaN or infinity', () => {
    // First, I check what happens when no study time is planned and the budget is zero.
    const neutralSummary = getWorkloadSummary(0, 0);

    expect(neutralSummary.isOverloaded).toBe(false);
    expect(neutralSummary.percentageUsed).toBe(0);
    expect(Number.isFinite(neutralSummary.percentageUsed)).toBe(true);

    // Now I check what happens when study time is planned but the budget is zero.
    const overloadSummary = getWorkloadSummary(45, 0);

    expect(overloadSummary.isOverloaded).toBe(true);
    expect(overloadSummary.excessMinutes).toBe(45);
    expect(overloadSummary.percentageUsed).toBe(100);
    expect(Number.isFinite(overloadSummary.percentageUsed)).toBe(true);
  });
});
