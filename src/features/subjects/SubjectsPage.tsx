import { WorkspacePlaceholder } from '@/shared/components/WorkspacePlaceholder';

export function SubjectsPage() {
  return (
    <WorkspacePlaceholder
      title="Subjects & classes"
      description="Bring your academic week into one clear view."
      icon="subjects"
      planned={[
        'Create, edit and archive your subjects.',
        'Add weekly class times and their active date range.',
        'Keep subject colours consistent across your planner.',
      ]}
    />
  );
}
