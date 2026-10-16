import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { authFixture, profileFixture } from '@/test/accountFixtures';
import { AccountPage } from './AccountPage';
import { AuthContext } from './authContext';

function show(context = authFixture()) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={context}>
        <AccountPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}
function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('account UI', () => {
  it('validates signup fields and focuses the first invalid input', () => {
    const context = authFixture();
    show(context);
    fireEvent.click(screen.getByRole('button', { name: /New to StudyFlow/ }));
    fill('Email address', 'wrong');
    fill('Password', 'short');
    fill('Confirm password', 'different');
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByLabelText('Display name')).toHaveFocus();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('The passwords do not match.')).toBeInTheDocument();
    expect(context.register).not.toHaveBeenCalled();
  });
  it('passes valid registration to the provider and prevents duplicate submissions', async () => {
    let finish!: () => void;
    const context = authFixture();
    context.register = () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      });
    show(context);
    fireEvent.click(screen.getByRole('button', { name: /New to StudyFlow/ }));
    fill('Display name', 'Student');
    fill('Email address', 'student@example.test');
    fill('Password', 'demo-pass-123');
    fill('Confirm password', 'demo-pass-123');
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('button', { name: 'Please wait…' })).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.getByLabelText('Password')).toHaveValue(''));
  });
  it('retains entered credentials on a failed sign-in and handles SDK errors', async () => {
    const context = authFixture();
    context.signIn = async () => {
      throw { code: 'auth/invalid-credential' };
    };
    show(context);
    fill('Email address', 'student@example.test');
    fill('Password', 'incorrect');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('email or password is incorrect');
    expect(screen.getByLabelText('Email address')).toHaveValue('student@example.test');
    expect(screen.getByLabelText('Password')).toHaveValue('incorrect');
  });
  it('lets an existing account retry failed profile setup without registering twice', () => {
    const context = authFixture({
      status: 'profile-error',
      user: { uid: 'a', email: 'a@example.test' },
      setupDisplayName: 'Original name',
      error: 'Connection failed',
    });
    show(context);
    expect(screen.getByLabelText('Display name')).toHaveValue('Original name');
    fireEvent.click(screen.getByRole('button', { name: 'Retry profile' }));
    expect(context.retryProfile).toHaveBeenCalledWith('Original name');
    expect(context.register).not.toHaveBeenCalled();
  });
  it.each(['disabled', 'loading', 'error'] as const)(
    'renders the %s state with working recovery controls',
    (status) => {
      show(authFixture({ status, error: status === 'error' ? 'Unavailable' : null }));
      if (status === 'disabled')
        expect(screen.getByRole('link', { name: 'Explore the workspace' })).toHaveAttribute(
          'href',
          '/dashboard',
        );
      if (status === 'loading') expect(screen.getByRole('status')).toHaveTextContent('Checking');
      if (status === 'error')
        expect(screen.getByRole('button', { name: 'Reload account' })).toBeInTheDocument();
    },
  );
  it('shows an authenticated account with links to settings and dashboard', () => {
    show(
      authFixture({
        status: 'ready',
        user: { uid: 'a', email: 'a@example.test' },
        profile: profileFixture(),
      }),
    );
    expect(screen.getByRole('heading', { name: 'Welcome, Student A' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit profile and budgets' })).toHaveAttribute(
      'href',
      '/settings',
    );
  });
});
