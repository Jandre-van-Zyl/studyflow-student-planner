import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './authContext';
import { StudySetup } from '@/features/settings/StudySetup';
import { needsStudySetup } from '@/features/settings/studySetupState';

export function AuthGate() {
  const { status, user, profile } = useAuth();
  const location = useLocation();
  if (status === 'disabled') return <Outlet />;
  if (status === 'loading' || status === 'membership-loading' || status === 'profile-loading') {
    return (
      <p role="status" className="notice">
        Opening your private workspace…
      </p>
    );
  }
  if (status !== 'ready' || !user) {
    return <Navigate to="/account" replace state={{ from: location.pathname + location.search }} />;
  }
  // Changing UID unmounts all feature state instead of retaining another student's form/data.
  if (profile && needsStudySetup(profile)) return <StudySetup key={user.uid} />;
  return <Outlet key={user.uid} />;
}
