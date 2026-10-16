import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AuthContext, type AuthContextValue } from '@/features/auth/authContext';
import { authFixture, profileFixture } from '@/test/accountFixtures';
import { AppShell } from '@/shared/components/AppShell';
import { AuthGate } from '@/features/auth/AuthGate';
import { AccountPage } from '@/features/auth/AccountPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PlanningWorkspace } from './PlanningWorkspace';

function context(uid: string) {
  return authFixture({
    status: 'ready',
    user: { uid, email: uid + '@example.test' },
    profile: profileFixture(uid),
  });
}
function tree(auth: AuthContextValue) {
  return (
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthContext.Provider value={auth}>
        <Routes>
          <Route element={<AppShell />}>
            <Route element={<PlanningWorkspace />}>
              <Route path="account" element={<AccountPage />} />
              <Route element={<AuthGate />}>
                <Route path="dashboard" element={<DashboardPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}
describe('preview session isolation', () => {
  it('discards old planner records immediately when UID changes', () => {
    const view = render(tree(context('a')));
    fireEvent.click(screen.getByRole('button', { name: 'Load example week' }));
    expect(screen.getByText('Requirements draft')).toBeInTheDocument();
    view.rerender(tree(context('b')));
    expect(screen.queryByText('Requirements draft')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load example week' })).toBeInTheDocument();
  });
  it('unmounts private records and the navigation when the session fails', () => {
    const view = render(tree(context('a')));
    fireEvent.click(screen.getByRole('button', { name: 'Load example week' }));
    view.rerender(tree(authFixture({ status: 'error', error: 'Session unavailable' })));
    expect(screen.queryByText('Requirements draft')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Account unavailable' })).toBeInTheDocument();
  });
});
