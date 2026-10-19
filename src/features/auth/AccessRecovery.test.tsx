import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { authFixture } from '@/test/accountFixtures';
import { AuthContext } from './authContext';
import { AccessRecovery } from './AccessRecovery';
function show(
  status:
    'verification-required' | 'membership-denied' | 'membership-error' = 'verification-required',
) {
  const auth = authFixture({
    status,
    user: { uid: 'a', email: 'a@example.test', emailVerified: status !== 'verification-required' },
  });
  render(
    <AuthContext.Provider value={auth}>
      <AccessRecovery />
    </AuthContext.Provider>,
  );
  return auth;
}
describe('student access recovery', () => {
  it('sends verification only on click, reports success and limits duplicate sends', async () => {
    const auth = show();
    expect(auth.sendVerification).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Send verification email' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Verification email sent'),
    );
    expect(screen.getByRole('button', { name: 'Wait 60 seconds to resend' })).toBeDisabled();
    expect(auth.sendVerification).toHaveBeenCalledTimes(1);
  });
  it.each(['membership-denied', 'membership-error'] as const)(
    'offers recheck and sign-out without exposing a planner: %s',
    async (status) => {
      const auth = show(status);
      expect(
        screen.queryByRole('button', { name: 'Send verification email' }),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Check access again' }));
      await waitFor(() => expect(auth.recheckAccess).toHaveBeenCalledOnce());
      await waitFor(() => expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled());
      fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
      await waitFor(() => expect(auth.signOut).toHaveBeenCalledOnce());
    },
  );
  it('retains recovery controls after an email-send failure', async () => {
    const auth = show();
    vi.mocked(auth.sendVerification).mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    fireEvent.click(screen.getByRole('button', { name: 'Send verification email' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('connection');
    expect(screen.getByRole('button', { name: 'Send verification email' })).toBeEnabled();
  });
  it('ignores duplicate clicks while an action is pending', async () => {
    const auth = show();
    let done!: () => void;
    vi.mocked(auth.recheckAccess).mockImplementation(
      () =>
        new Promise((resolve) => {
          done = resolve;
        }),
    );
    const button = screen.getByRole('button', { name: 'Check access again' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(auth.recheckAccess).toHaveBeenCalledOnce();
    await act(async () => done());
  });
});
