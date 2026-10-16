import { Link, Navigate, Route, Routes } from 'react-router';
import { AssessmentsPage } from '@/features/assessments/AssessmentsPage';
import { AccountPage } from '@/features/auth/AccountPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PlannerPage } from '@/features/planner/PlannerPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { SubjectsPage } from '@/features/subjects/SubjectsPage';
import { AppShell } from '@/shared/components/AppShell';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="planner" element={<PlannerPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="*"
          element={
            <section className="rounded-3xl border border-slate-200 bg-white p-8">
              <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
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
  );
}
