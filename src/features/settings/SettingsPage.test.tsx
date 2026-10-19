import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/features/auth/authContext';
import { ProfileConflictError } from '@/features/auth/errors';
import { saveProfile } from '@/features/auth/profileService';
import { authFixture, profileFixture } from '@/test/accountFixtures';
import { SettingsPage } from './SettingsPage';

vi.mock('@/features/auth/profileService', () => ({ saveProfile: vi.fn() }));
const user = { uid: 'a', email: 'a@example.test', emailVerified: true };
function context(name = 'Student A', revision = 1) {
  return authFixture({ status: 'ready', user, profile: profileFixture(name, revision) });
}
function show(value = context()) {
  function ui(current: ReturnType<typeof context>) {
    return (
      <MemoryRouter>
        <AuthContext.Provider value={current}>
          <SettingsPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }
  const view = render(ui(value));
  return { ...view, update: (next: ReturnType<typeof context>) => view.rerender(ui(next)) };
}
function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
beforeEach(() => vi.resetAllMocks());
describe('settings editing', () => {
  it('displays all seven saved budgets and a fixed timezone', () => {
    show();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(7);
    expect(screen.getByLabelText('Monday (minutes)')).toHaveValue(0);
    expect(screen.getByText(/SAST, UTC/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled();
  });
  it('saves every day including zero and 1440, using the loaded revision', async () => {
    const profile = profileFixture('Updated', 2);
    profile.studyBudgetMinutes[1] = 1440;
    vi.mocked(saveProfile).mockResolvedValue(profile);
    show();
    change('Display name', ' Updated ');
    change('Monday (minutes)', '1440');
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByRole('status')).toHaveTextContent('saved');
    expect(screen.getByRole('status')).toHaveFocus();
    expect(saveProfile).toHaveBeenCalledWith(
      'a',
      {
        displayName: 'Updated',
        studyBudgetMinutes: { 1: 1440, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
      },
      profileFixture().updatedAt,
    );
  });
  it.each(['', '-1', '1.5', '1441'])('rejects invalid budget %s before writing', (value) => {
    show();
    change('Monday (minutes)', value);
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(screen.getByLabelText('Monday (minutes)')).toHaveAttribute('aria-invalid', 'true');
    expect(saveProfile).not.toHaveBeenCalled();
  });
  it('retains all form inputs on a denied save and does not report success', async () => {
    vi.mocked(saveProfile).mockRejectedValue({ code: 'permission-denied' });
    show();
    change('Display name', 'My edit');
    change('Tuesday (minutes)', '60');
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Access was denied');
    expect(screen.getByLabelText('Display name')).toHaveValue('My edit');
    expect(screen.getByLabelText('Tuesday (minutes)')).toHaveValue(60);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('preserves unsaved text when a remote profile update arrives, until explicit reload', () => {
    const view = show();
    change('Display name', 'Unsaved');
    view.update(context('Elsewhere', 2));
    expect(screen.getByLabelText('Display name')).toHaveValue('Unsaved');
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reload latest profile' }));
    expect(screen.getByLabelText('Display name')).toHaveValue('Elsewhere');
  });
  it('handles a concurrent update detected at the service boundary without losing edits', async () => {
    vi.mocked(saveProfile).mockRejectedValue(new ProfileConflictError());
    show();
    change('Display name', 'Unsaved');
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('another session');
    expect(screen.getByLabelText('Display name')).toHaveValue('Unsaved');
  });
  it('unmounts old inputs and ignores old save completion on an account switch', async () => {
    let resolve!: (profile: ReturnType<typeof profileFixture>) => void;
    vi.mocked(saveProfile).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const view = show();
    change('Display name', 'Old pending');
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    view.update({
      ...context('Student B'),
      user: { uid: 'b', email: 'b@example.test', emailVerified: true },
    });
    await act(async () => resolve(profileFixture('Old pending', 2)));
    expect(screen.getByLabelText('Display name')).toHaveValue('Student B');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('permits retry after failure with the same preserved values', async () => {
    vi.mocked(saveProfile)
      .mockRejectedValueOnce({ code: 'unavailable' })
      .mockResolvedValueOnce(profileFixture('Retry', 2));
    show();
    change('Display name', 'Retry');
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('saved'));
    expect(saveProfile).toHaveBeenCalledTimes(2);
  });
});
