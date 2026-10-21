import { Link, Navigate, Route, Routes } from 'react-router';
import { AssessmentsPage } from '@/features/assessments/AssessmentsPage';
import { AccountPage } from '@/features/auth/AccountPage';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AuthGate } from '@/features/auth/AuthGate';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PlannerPage } from '@/features/planner/PlannerPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { SubjectsPage } from '@/features/subjects/SubjectsPage';
import { AppShell } from '@/shared/components/AppShell';
import { PlanningWorkspace } from '@/features/planner/PlanningWorkspace';
import { CtuSyncPage } from '@/features/ctu/CtuSyncPage';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route element={<PlanningWorkspace />}>
            <Route path="account" element={<AccountPage />} />
            <Route element={<AuthGate />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="subjects" element={<SubjectsPage />} />
              <Route path="assessments" element={<AssessmentsPage />} />
              <Route path="planner" element={<PlannerPage />} />
              <Route path="settings" element={<SettingsPage />} />
              {import.meta.env.VITE_CTU_PROTOTYPE === 'true' && (
                <Route path="ctu-sync" element={<CtuSyncPage />} />
              )}
            </Route>
          </Route>
          <Route
            path="*"
            element={
              <section>
                <h1>Page not found</h1>
                <p className="mt-3">This page is not part of your planner.</p>
                <Link
                  className="mt-6 inline-block font-semibold text-accent underline"
                  to="/dashboard"
                >
                  Return to dashboard
                </Link>
              </section>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
