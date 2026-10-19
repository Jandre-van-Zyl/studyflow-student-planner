export type Priority = 'High' | 'Medium' | 'Low';

export type AssessmentStatus = 'To Do' | 'In Progress' | 'Completed';

export interface AssessmentItem {
  id: string;
  subjectId: string;
  title: string;
  type: 'Assignment' | 'Test' | 'Exam' | 'Project';
  dueAt: Date;
  priority: Priority;
  status: AssessmentStatus;
  remainingMinutes: number;
  archived: boolean;
}

export interface RecommendedTask {
  assessment: AssessmentItem;
  bucket: number;
  explanation: string;
  isQuickTask: boolean;
}

// I gave each priority a number so I can sort the tasks later.
const PRIORITY_WEIGHT: Record<Priority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

// I count tasks that take 30 minutes or less as quick tasks.
const QUICK_TASK_LIMIT_MINUTES = 30;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

/**
 * I use this function to help the student decide what to work on next.
 *
 * I put the tasks into groups depending on when they are due:
 * 0 = The task is already overdue
 * 1 = The task is due within 24 hours
 * 2 = The task is due within 72 hours
 * 3 = The task is due within 7 days
 * 4 = The task is due later than 7 days
 */
export function getRecommendedTasks(
  items: AssessmentItem[],
  now: Date = new Date(),
): RecommendedTask[] {
  return items
    .filter((item) => item.status !== 'Completed' && !item.archived)
    .map((assessment): RecommendedTask => {
      // I calculate how many hours are left before the task is due.
      const hoursUntilDue = (assessment.dueAt.getTime() - now.getTime()) / MILLISECONDS_PER_HOUR;

      let bucket: number;
      let explanation: string;

      // I check when the task is due and put it in the right group.
      if (hoursUntilDue < 0) {
        bucket = 0;
        explanation = 'Overdue — complete this task as soon as possible.';
      } else if (hoursUntilDue <= 24) {
        bucket = 1;
        explanation = 'Due within 24 hours.';
      } else if (hoursUntilDue <= 72) {
        bucket = 2;
        explanation = 'Due within 72 hours.';
      } else if (hoursUntilDue <= 168) {
        bucket = 3;
        explanation = 'Due within 7 days.';
      } else {
        bucket = 4;
        explanation = 'Due later — plan ahead.';
      }

      return {
        assessment,
        bucket,
        explanation,

        // I mark the task as quick if it takes between 1 and 30 minutes.
        isQuickTask:
          assessment.remainingMinutes > 0 &&
          assessment.remainingMinutes <= QUICK_TASK_LIMIT_MINUTES,
      };
    })
    .sort((a, b) => {
      // I show the tasks with the closest deadlines first.
      if (a.bucket !== b.bucket) {
        return a.bucket - b.bucket;
      }

      // If two tasks are in the same group, I show High priority first.
      const priorityDifference =
        PRIORITY_WEIGHT[b.assessment.priority] - PRIORITY_WEIGHT[a.assessment.priority];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      // If they have the same priority, I show the task due first.
      return a.assessment.dueAt.getTime() - b.assessment.dueAt.getTime();
    });
}
