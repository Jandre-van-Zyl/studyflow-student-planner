import type {
  AssessmentPriority,
  AssessmentStatus,
  AssessmentType,
} from '../../../shared/types/planner';

export type { AssessmentPriority, AssessmentStatus, AssessmentType };

export interface AssessmentItem {
  id: string;
  subjectId: string;
  title: string;
  type: AssessmentType;
  dueAt: Date;
  priority: AssessmentPriority;
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

const PRIORITY_WEIGHT: Record<AssessmentPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const QUICK_TASK_LIMIT_MINUTES = 30;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

function getDeadlineBucket(hoursUntilDue: number): number {
  if (hoursUntilDue < 0) return 0;
  if (hoursUntilDue <= 24) return 1;
  if (hoursUntilDue <= 72) return 2;
  if (hoursUntilDue <= 168) return 3;
  return 4;
}

function getUrgencyExplanation(bucket: number): string {
  switch (bucket) {
    case 0:
      return 'Overdue';
    case 1:
      return 'Due within 24 hours';
    case 2:
      return 'Due within 72 hours';
    case 3:
      return 'Due within 7 days';
    default:
      return 'Due later';
  }
}

export function getRecommendedTasks(
  items: AssessmentItem[],
  now: Date = new Date(),
): RecommendedTask[] {
  return items
    .filter((item) => item.status !== 'Completed' && !item.archived)
    .map((assessment): RecommendedTask => {
      const hoursUntilDue = (assessment.dueAt.getTime() - now.getTime()) / MILLISECONDS_PER_HOUR;
      const bucket = getDeadlineBucket(hoursUntilDue);
      const urgency = getUrgencyExplanation(bucket);

      return {
        assessment,
        bucket,
        explanation: `${urgency} - ${assessment.priority.toLowerCase()} priority`,
        isQuickTask:
          assessment.remainingMinutes > 0 &&
          assessment.remainingMinutes <= QUICK_TASK_LIMIT_MINUTES,
      };
    })
    .sort((a, b) => {
      if (a.bucket !== b.bucket) {
        return a.bucket - b.bucket;
      }

      const priorityDifference =
        PRIORITY_WEIGHT[b.assessment.priority] - PRIORITY_WEIGHT[a.assessment.priority];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      const deadlineDifference = a.assessment.dueAt.getTime() - b.assessment.dueAt.getTime();

      if (deadlineDifference !== 0) {
        return deadlineDifference;
      }

      const effortDifference = a.assessment.remainingMinutes - b.assessment.remainingMinutes;

      if (effortDifference !== 0) {
        return effortDifference;
      }

      return a.assessment.id.localeCompare(b.assessment.id);
    });
}
