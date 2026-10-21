import { describe, it, expect } from 'vitest';
import { calculateDailyAllocation, getWorkloadSummary, type StudyBlockItem } from './workload';

describe('FR-12 Daily Workload Calculations', () => {
  const targetDate = new Date('2026-10-15T00:00:00+02:00');

  it('TC-26: counts planned and done blocks, ignores cancelled blocks, and calculates excess', () => {
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

    const allocated = calculateDailyAllocation(blocks, targetDate);

    expect(allocated).toBe(90);

    const summary = getWorkloadSummary(allocated, 60);

    expect(summary.allocatedMinutes).toBe(90);
    expect(summary.budgetMinutes).toBe(60);
    expect(summary.excessMinutes).toBe(30);
    expect(summary.isOverloaded).toBe(true);
  });

  it('TC-27: handles zero budget without NaN or infinity', () => {
    const neutralSummary = getWorkloadSummary(0, 0);

    expect(neutralSummary.isOverloaded).toBe(false);
    expect(neutralSummary.excessMinutes).toBe(0);
    expect(neutralSummary.percentageUsed).toBe(0);
    expect(Number.isFinite(neutralSummary.percentageUsed)).toBe(true);

    const overloadSummary = getWorkloadSummary(45, 0);

    expect(overloadSummary.isOverloaded).toBe(true);
    expect(overloadSummary.excessMinutes).toBe(45);
    expect(overloadSummary.percentageUsed).toBe(100);
    expect(Number.isFinite(overloadSummary.percentageUsed)).toBe(true);
  });

  it('counts a UTC timestamp on the correct South African calendar day', () => {
    const block: StudyBlockItem = {
      id: 'utc-block',
      startAt: new Date('2026-10-18T22:15:00Z'),
      endAt: new Date('2026-10-18T22:45:00Z'),
      status: 'Planned',
    };

    const october19 = new Date('2026-10-19T00:00:00+02:00');
    const october18 = new Date('2026-10-18T00:00:00+02:00');

    expect(calculateDailyAllocation([block], october19)).toBe(30);
    expect(calculateDailyAllocation([block], october18)).toBe(0);
  });

  it('correctly reads a screen-data ISO timestamp with the +02:00 offset', () => {
    const screenStartAt = '2026-10-19T10:15:00+02:00';
    const screenEndAt = '2026-10-19T10:45:00+02:00';

    const block: StudyBlockItem = {
      id: 'screen-data-block',
      startAt: new Date(screenStartAt),
      endAt: new Date(screenEndAt),
      status: 'Planned',
    };

    const october19 = new Date('2026-10-19T00:00:00+02:00');

    expect(calculateDailyAllocation([block], october19)).toBe(30);
  });
});
