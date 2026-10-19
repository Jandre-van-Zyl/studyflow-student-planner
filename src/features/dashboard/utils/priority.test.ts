import { describe, it, expect } from 'vitest';
import { getRecommendedTasks, type AssessmentItem } from './priority';

describe('FR-11 Next-Task Recommendation Engine', () => {
  // I use this time for all my tests so the results stay the same each time.
  const now = new Date('2026-10-15T10:00:00+02:00');

  it('TC-23: excludes completed/archived items and leads with overdue tasks', () => {
    const items: AssessmentItem[] = [
      {
        id: '1',
        subjectId: 'sub1',
        title: 'Completed Essay',
        type: 'Assignment',
        dueAt: new Date('2026-10-14T10:00:00+02:00'),
        priority: 'High',
        status: 'Completed',
        remainingMinutes: 0,
        archived: false,
      },
      {
        id: '2',
        subjectId: 'sub1',
        title: 'Overdue Quiz',
        type: 'Test',
        dueAt: new Date('2026-10-15T09:59:59+02:00'),
        priority: 'Low',
        status: 'To Do',
        remainingMinutes: 45,
        archived: false,
      },
      {
        id: '3',
        subjectId: 'sub1',
        title: 'Archived Lab',
        type: 'Project',
        dueAt: new Date('2026-10-14T10:00:00+02:00'),
        priority: 'High',
        status: 'To Do',
        remainingMinutes: 60,
        archived: true,
      },
    ];

    // I send the test tasks to my recommendation function.
    const results = getRecommendedTasks(items, now);

    // I check that completed and archived tasks are left out.
    // Only the overdue quiz should be returned.
    expect(results).toHaveLength(1);
    expect(results[0]?.assessment.id).toBe('2');
    expect(results[0]?.bucket).toBe(0);
    expect(results[0]?.explanation).toContain('Overdue');
  });

  it('TC-24: assigns the correct buckets at 24h, 72h, and 168h', () => {
    const items: AssessmentItem[] = [
      {
        id: 'exact-24h',
        subjectId: 'sub1',
        title: 'Task A',
        type: 'Assignment',
        dueAt: new Date('2026-10-16T10:00:00+02:00'),
        priority: 'Medium',
        status: 'To Do',
        remainingMinutes: 60,
        archived: false,
      },
      {
        id: 'exact-72h',
        subjectId: 'sub1',
        title: 'Task B',
        type: 'Assignment',
        dueAt: new Date('2026-10-18T10:00:00+02:00'),
        priority: 'Medium',
        status: 'To Do',
        remainingMinutes: 60,
        archived: false,
      },
      {
        id: 'exact-168h',
        subjectId: 'sub1',
        title: 'Task C',
        type: 'Assignment',
        dueAt: new Date('2026-10-22T10:00:00+02:00'),
        priority: 'Medium',
        status: 'To Do',
        remainingMinutes: 60,
        archived: false,
      },
    ];

    // I check that each deadline goes into the correct group.
    const results = getRecommendedTasks(items, now);

    const task24h = results.find((task) => task.assessment.id === 'exact-24h');
    const task72h = results.find((task) => task.assessment.id === 'exact-72h');
    const task168h = results.find((task) => task.assessment.id === 'exact-168h');

    // These checks make sure the deadline groups are correct.
    expect(task24h?.bucket).toBe(1);
    expect(task72h?.bucket).toBe(2);
    expect(task168h?.bucket).toBe(3);
  });

  it('TC-25: sorts High > Medium > Low priority within the same bucket', () => {
    const items: AssessmentItem[] = [
      {
        id: 'low-prio-quick',
        subjectId: 'sub1',
        title: 'Low Priority Quick Task',
        type: 'Assignment',
        dueAt: new Date('2026-10-16T08:00:00+02:00'),
        priority: 'Low',
        status: 'To Do',
        remainingMinutes: 15,
        archived: false,
      },
      {
        id: 'high-prio-long',
        subjectId: 'sub1',
        title: 'High Priority Long Task',
        type: 'Exam',
        dueAt: new Date('2026-10-16T09:00:00+02:00'),
        priority: 'High',
        status: 'To Do',
        remainingMinutes: 120,
        archived: false,
      },
    ];

    // I check that priority comes before the time needed for a task.
    const results = getRecommendedTasks(items, now);

    // The High priority task should appear first, even though it takes longer.
    expect(results[0]?.assessment.id).toBe('high-prio-long');
    expect(results[0]?.isQuickTask).toBe(false);

    // The Low priority task takes only 15 minutes, so it counts as a quick task.
    expect(results[1]?.assessment.id).toBe('low-prio-quick');
    expect(results[1]?.isQuickTask).toBe(true);
  });
});
