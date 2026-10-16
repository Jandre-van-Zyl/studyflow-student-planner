import { WorkspacePlaceholder } from '@/shared/components/WorkspacePlaceholder';

export function AccountPage() {
  return (
    <WorkspacePlaceholder
      title="Your account"
      description="A private planner for your academic commitments."
      icon="account"
      planned={[
        'Register and sign in with email and password.',
        'Load only your own profile and planning records.',
        'Clear saved screen state when signing out or changing accounts.',
      ]}
    />
  );
}
