import { WorkspacePlaceholder } from '@/shared/components/WorkspacePlaceholder';

export function PlannerPage() {
  return (
    <WorkspacePlaceholder
      title="Weekly planner"
      description="Give your study time a realistic place in your week."
      icon="planner"
      planned={[
        'See classes, deadlines and study sessions together.',
        'Plan dated sessions linked to an assessment.',
        'Review class clashes and daily study-budget warnings.',
      ]}
    />
  );
}
