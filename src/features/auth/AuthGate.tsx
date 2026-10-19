import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './authContext';

export function AuthGate() {
  const { status, user } = useAuth();
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
  return <Outlet key={user.uid} />;
}
