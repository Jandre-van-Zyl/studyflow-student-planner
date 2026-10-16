import { WorkspacePlaceholder } from '@/shared/components/WorkspacePlaceholder';

export function AssessmentsPage() {
  return (
    <WorkspacePlaceholder
      title="Assessments"
      description="Know what is due and how much work remains."
      icon="assessments"
      planned={[
        'Record assignments, tests, exams and projects.',
        'Search and filter deadlines by subject and status.',
        'Update remaining effort, complete work and retain history.',
      ]}
    />
  );
}
