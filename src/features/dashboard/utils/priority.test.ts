import { describe, it, expect } from 'vitest';
import { getRecommendedTasks, type AssessmentItem } from './priority';

describe('FR-11 Next-Task Recommendation Engine', () => {
  const now = new Date('2026-10-15T10:00:00+02:00');

  const makeAssessment = (
    overrides: Partial<AssessmentItem> & Pick<AssessmentItem, 'id'>,
  ): AssessmentItem => ({
    subjectId: 'sub1',
    title: `Task ${overrides.id}`,
    type: 'Assignment',
    dueAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
    priority: 'Medium',
    status: 'To Do',
    remainingMinutes: 60,
    archived: false,
    ...overrides,
  });

  it('TC-23: excludes completed/archived items and leads with overdue tasks', () => {
    const items = [
      makeAssessment({
        id: 'completed',
        status: 'Completed',
        priority: 'High',
        dueAt: new Date(now.getTime() - 60_000),
      }),
      makeAssessment({
        id: 'overdue',
        priority: 'Low',
        dueAt: new Date(now.getTime() - 1),
      }),
      makeAssessment({
        id: 'archived',
        archived: true,
        dueAt: new Date(now.getTime() - 60_000),
      }),
    ];

    const results = getRecommendedTasks(items, now);

    expect(results).toHaveLength(1);
    expect(results[0]?.assessment.id).toBe('overdue');
    expect(results[0]?.bucket).toBe(0);
    expect(results[0]?.explanation).toContain('Overdue');
    expect(results[0]?.explanation).toContain('low priority');
  });

  it('TC-24: assigns the correct buckets at 24h, 72h, and 168h', () => {
    const items = [
      makeAssessment({
        id: 'exact-24h',
        dueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      }),
      makeAssessment({
        id: 'exact-72h',
        dueAt: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      }),
      makeAssessment({
        id: 'exact-168h',
        dueAt: new Date(now.getTime() + 168 * 60 * 60 * 1000),
      }),
    ];

    const results = getRecommendedTasks(items, now);

    expect(results.find((task) => task.assessment.id === 'exact-24h')?.bucket).toBe(1);
    expect(results.find((task) => task.assessment.id === 'exact-72h')?.bucket).toBe(2);
    expect(results.find((task) => task.assessment.id === 'exact-168h')?.bucket).toBe(3);
  });

  it('TC-25: sorts High > Medium > Low priority before considering effort', () => {
    const items = [
      makeAssessment({
        id: 'low-quick',
        priority: 'Low',
        remainingMinutes: 15,
      }),
      makeAssessment({
        id: 'medium',
        priority: 'Medium',
        remainingMinutes: 30,
      }),
      makeAssessment({
        id: 'high-long',
        priority: 'High',
        remainingMinutes: 120,
      }),
    ];

    const results = getRecommendedTasks(items, now);

    expect(results.map((task) => task.assessment.id)).toEqual(['high-long', 'medium', 'low-quick']);
    expect(results[2]?.isQuickTask).toBe(true);
    expect(results[0]?.isQuickTask).toBe(false);
  });

  it('TC-23: sorts by shorter effort, then assessment ID for equal deadlines and priorities', () => {
    const dueAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const items = [
      makeAssessment({ id: 'z', dueAt, remainingMinutes: 15 }),
      makeAssessment({ id: 'a', dueAt, remainingMinutes: 15 }),
      makeAssessment({ id: 'long', dueAt, remainingMinutes: 120 }),
    ];

    const expected = ['a', 'z', 'long'];

    expect(getRecommendedTasks(items, now).map((task) => task.assessment.id)).toEqual(expected);

    expect(
      getRecommendedTasks([...items].reverse(), now).map((task) => task.assessment.id),
    ).toEqual(expected);
  });

  it('TC-23: earlier exact deadline wins before effort when bucket and priority match', () => {
    const results = getRecommendedTasks(
      [
        makeAssessment({
          id: 'later-short',
          dueAt: new Date(now.getTime() + 20 * 60 * 60 * 1000),
          remainingMinutes: 15,
        }),
        makeAssessment({
          id: 'earlier-long',
          dueAt: new Date(now.getTime() + 10 * 60 * 60 * 1000),
          remainingMinutes: 120,
        }),
      ],
      now,
    );

    expect(results.map((task) => task.assessment.id)).toEqual(['earlier-long', 'later-short']);
  });

  it('FR-11: includes urgency and priority in the explanation', () => {
    const [task] = getRecommendedTasks([makeAssessment({ id: 'urgent', priority: 'High' })], now);

    expect(task?.explanation).toBe('Due within 24 hours - high priority');
  });

  it('returns an empty list when no eligible tasks remain', () => {
    expect(
      getRecommendedTasks(
        [
          makeAssessment({ id: 'completed', status: 'Completed' }),
          makeAssessment({ id: 'archived', archived: true }),
        ],
        now,
      ),
    ).toEqual([]);
  });

  it('places tasks exactly on each deadline boundary in the expected bucket', () => {
    const boundaries = [
      { hours: 0, bucket: 1 },
      { hours: 24, bucket: 1 },
      { hours: 72, bucket: 2 },
      { hours: 168, bucket: 3 },
    ];

    for (const { hours, bucket } of boundaries) {
      const task = makeAssessment({
        id: `boundary-${hours}`,
        dueAt: new Date(now.getTime() + hours * 60 * 60 * 1000),
      });

      expect(getRecommendedTasks([task], now)[0]?.bucket).toBe(bucket);
    }
  });

  it('places tasks immediately before and after every deadline boundary correctly', () => {
    const boundaries = [
      { hours: 0, beforeBucket: 0, afterBucket: 1 },
      { hours: 24, beforeBucket: 1, afterBucket: 2 },
      { hours: 72, beforeBucket: 2, afterBucket: 3 },
      { hours: 168, beforeBucket: 3, afterBucket: 4 },
    ];

    for (const { hours, beforeBucket, afterBucket } of boundaries) {
      const boundaryTime = now.getTime() + hours * 60 * 60 * 1000;

      const before = makeAssessment({
        id: `before-${hours}`,
        dueAt: new Date(boundaryTime - 1),
      });

      const after = makeAssessment({
        id: `after-${hours}`,
        dueAt: new Date(boundaryTime + 1),
      });

      expect(getRecommendedTasks([before], now)[0]?.bucket).toBe(beforeBucket);
      expect(getRecommendedTasks([after], now)[0]?.bucket).toBe(afterBucket);
    }
  });

  it('marks 30-minute tasks as quick but not 31-minute tasks', () => {
    const results = getRecommendedTasks(
      [
        makeAssessment({ id: '30-minutes', remainingMinutes: 30 }),
        makeAssessment({ id: '31-minutes', remainingMinutes: 31 }),
      ],
      now,
    );

    expect(results.find((task) => task.assessment.id === '30-minutes')?.isQuickTask).toBe(true);

    expect(results.find((task) => task.assessment.id === '31-minutes')?.isQuickTask).toBe(false);
  });
});
