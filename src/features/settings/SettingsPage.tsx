import { WorkspacePlaceholder } from '@/shared/components/WorkspacePlaceholder';

export function SettingsPage() {
  return (
    <WorkspacePlaceholder
      title="Settings"
      description="Make your planner work with the time you actually have."
      icon="settings"
      planned={[
        'Choose a display name and study budget for each day.',
        'Review planning times in Africa/Johannesburg.',
        'Keep your personal preferences with your account.',
      ]}
    />
  );
}
