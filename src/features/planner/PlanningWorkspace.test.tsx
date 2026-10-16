import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '@/features/auth/authContext';
import { authFixture, profileFixture } from '@/test/accountFixtures';
import { AppShell } from '@/shared/components/AppShell';
import { AuthGate } from '@/features/auth/AuthGate';
import { AccountPage } from '@/features/auth/AccountPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PlanningWorkspace } from './PlanningWorkspace';
import { SubjectsPage } from '@/features/subjects/SubjectsPage';
import { EMPTY_VIEW, exampleView, type PlanningView } from './planningView';
import { PlannerError } from './plannerContract';
import { savePlannerRecord, watchPlanner } from './plannerService';

vi.mock('./plannerService', () => ({ savePlannerRecord: vi.fn(), watchPlanner: vi.fn() }));
let observers: {
  uid: string;
  next: (data: PlanningView) => void;
  fail: (error: unknown) => void;
  stop: ReturnType<typeof vi.fn>;
}[];
beforeEach(() => {
  vi.clearAllMocks();
  observers = [];
  vi.mocked(watchPlanner).mockImplementation((uid, next, fail) => {
    const stop = vi.fn();
    observers.push({ uid, next, fail, stop });
    return stop;
  });
});

function context(uid: string) {
  return authFixture({
    status: 'ready',
    user: { uid, email: uid + '@example.test' },
    profile: profileFixture(uid),
  });
}
function tree(auth: AuthContextValue, path = '/dashboard') {
  return (
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={auth}>
        <Routes>
          <Route element={<AppShell />}>
            <Route element={<PlanningWorkspace />}>
              <Route path="account" element={<AccountPage />} />
              <Route element={<AuthGate />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="subjects" element={<SubjectsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}
describe('persistent workspace lifecycle', () => {
  it('discards old planner records immediately when UID changes', () => {
    const view = render(tree(context('a')));
    act(() => observers[0]!.next(exampleView()));
    expect(screen.getByText('Requirements draft')).toBeInTheDocument();
    view.rerender(tree(context('b')));
    expect(screen.queryByText('Requirements draft')).not.toBeInTheDocument();
    expect(observers[0]!.stop).toHaveBeenCalled();
    act(() => observers[0]!.next(exampleView()));
    expect(screen.queryByText('Requirements draft')).not.toBeInTheDocument();
    expect(screen.getByText('Loading your saved planner…')).toBeInTheDocument();
    act(() => observers[1]!.next(EMPTY_VIEW));
    expect(screen.queryByRole('button', { name: 'Load example week' })).not.toBeInTheDocument();
  });
  it('unmounts private records and the navigation when the session fails', () => {
    const view = render(tree(context('a')));
    act(() => observers[0]!.next(exampleView()));
    view.rerender(tree(authFixture({ status: 'error', error: 'Session unavailable' })));
    expect(screen.queryByText('Requirements draft')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Account unavailable' })).toBeInTheDocument();
    expect(observers[0]!.stop).toHaveBeenCalled();
  });
  it('distinguishes failed loading from empty, hides stale data, and retries without accepting late callbacks', () => {
    render(tree(context('a')));
    act(() => observers[0]!.next(exampleView()));
    act(() => observers[0]!.fail(new Error('connection lost')));
    expect(screen.getByText('Requirements draft')).not.toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded');
    act(() => observers[0]!.next(exampleView()));
    expect(screen.getByText('Requirements draft')).not.toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Retry planner' }));
    act(() => observers[1]!.next(EMPTY_VIEW));
    expect(screen.getByRole('heading', { name: 'This week' })).toBeInTheDocument();
  });
  it('retains failed drafts, locks duplicate submissions and retries the same creation ID', async () => {
    let reject!: (error: unknown) => void;
    vi.mocked(savePlannerRecord).mockImplementationOnce(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail;
        }),
    );
    render(tree(context('a'), '/subjects'));
    act(() => observers[0]!.next(EMPTY_VIEW));
    fireEvent.click(screen.getByRole('button', { name: 'Add subject' }));
    fireEvent.change(screen.getByLabelText('Subject name'), {
      target: { value: 'Draft retained' },
    });
    fireEvent.change(screen.getByLabelText('Subject code'), { target: { value: 'DRAFT' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save subject' }));
    expect(screen.getByRole('button', { name: 'Save subject' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Save subject' }));
    expect(savePlannerRecord).toHaveBeenCalledTimes(1);
    await act(async () =>
      reject(new PlannerError('conflict', 'Changed in another session. Close and reopen.')),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject name')).toHaveValue('Draft retained');
    expect(screen.getByRole('alert')).toHaveTextContent('another session');
    vi.mocked(savePlannerRecord).mockResolvedValueOnce(exampleView().subjects[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Save subject' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(savePlannerRecord).toHaveBeenCalledTimes(2);
    expect(vi.mocked(savePlannerRecord).mock.calls[0]![2].id).toBe(
      vi.mocked(savePlannerRecord).mock.calls[1]![2].id,
    );
  });
  it('does not let late save confirmation close or restore a different owner workspace', async () => {
    let resolve!: (value: never) => void;
    vi.mocked(savePlannerRecord).mockImplementationOnce(
      () =>
        new Promise((success) => {
          resolve = success;
        }),
    );
    const view = render(tree(context('a'), '/subjects'));
    act(() => observers[0]!.next(EMPTY_VIEW));
    fireEvent.click(screen.getByRole('button', { name: 'Add subject' }));
    fireEvent.change(screen.getByLabelText('Subject name'), { target: { value: 'Old owner' } });
    fireEvent.change(screen.getByLabelText('Subject code'), { target: { value: 'OLD' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save subject' }));
    view.rerender(tree(context('b'), '/subjects'));
    act(() => observers[1]!.next(EMPTY_VIEW));
    await act(async () => resolve(exampleView().subjects[0]! as never));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/Subject saved/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add subject' })).toBeEnabled();
  });
  it('retries its own subject after a committed creation loses its acknowledgement', async () => {
    let reject!: (error: unknown) => void;
    vi.mocked(savePlannerRecord).mockImplementationOnce(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail;
        }),
    );
    render(tree(context('a'), '/subjects'));
    act(() => observers[0]!.next(EMPTY_VIEW));
    fireEvent.click(screen.getByRole('button', { name: 'Add subject' }));
    fireEvent.change(screen.getByLabelText('Subject name'), {
      target: { value: 'Saved before acknowledgement' },
    });
    fireEvent.change(screen.getByLabelText('Subject code'), { target: { value: 'ACK' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save subject' }));
    const draft = vi.mocked(savePlannerRecord).mock
      .calls[0]![2] as PlanningView['subjects'][number];
    act(() => observers[0]!.next({ ...EMPTY_VIEW, subjects: [draft] }));
    await act(async () => reject(new Error('Acknowledgement lost')));
    vi.mocked(savePlannerRecord).mockResolvedValueOnce(draft);
    fireEvent.click(screen.getByRole('button', { name: 'Save subject' }));
    await waitFor(() => expect(savePlannerRecord).toHaveBeenCalledTimes(2));
    expect(vi.mocked(savePlannerRecord).mock.calls[1]![2].id).toBe(draft.id);
  });
  it('keeps an open same-owner draft through listener failure and explicit retry', () => {
    render(tree(context('a'), '/subjects'));
    act(() => observers[0]!.next(EMPTY_VIEW));
    fireEvent.click(screen.getByRole('button', { name: 'Add subject' }));
    fireEvent.change(screen.getByLabelText('Subject name'), {
      target: { value: 'Keep this draft' },
    });
    act(() => observers[0]!.fail(new Error('Disconnected')));
    fireEvent.click(screen.getByRole('button', { name: 'Retry planner' }));
    act(() => observers[1]!.next(EMPTY_VIEW));
    expect(screen.getByLabelText('Subject name')).toHaveValue('Keep this draft');
  });
});
