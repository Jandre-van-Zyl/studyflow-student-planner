import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { profileFixture } from '@/test/accountFixtures';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './authContext';
import { registerAccount, signOutAccount, watchCurrentUser, type SessionUser } from './authService';
import { ensureProfile, watchProfile } from './profileService';
import type { UserProfile } from '@/shared/types/planner';

vi.mock('./authService', () => ({
  watchCurrentUser: vi.fn(),
  registerAccount: vi.fn(),
  signInAccount: vi.fn(),
  signOutAccount: vi.fn(),
}));
vi.mock('./profileService', () => ({ watchProfile: vi.fn(), ensureProfile: vi.fn() }));
let nextUser: (user: SessionUser | null) => void;
let failUser: (error: unknown) => void;
let stopUser: Mock<() => void>;
let profiles: {
  uid: string;
  next: (profile: UserProfile | null) => void;
  fail: (error: unknown) => void;
  stop: Mock<() => void>;
}[];
const a = { uid: 'a', email: 'a@example.test' };
const b = { uid: 'b', email: 'b@example.test' };

function Consumer() {
  const auth = useAuth();
  return (
    <>
      <p data-testid="status">{auth.status}</p>
      <p data-testid="uid">{auth.user?.uid ?? ''}</p>
      <p data-testid="profile">{auth.profile?.displayName ?? ''}</p>
      <p data-testid="error">{auth.error ?? ''}</p>
      <button
        onClick={() => {
          void auth.register('Chosen name', ' A@example.test ', 'test-pass-123').catch(() => {});
        }}
      >
        Register
      </button>
      <button
        onClick={() => {
          void auth.signOut().catch(() => {});
        }}
      >
        Out
      </button>
      <button onClick={() => auth.retryProfile()}>Retry</button>
    </>
  );
}
function show() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
}
function user(value: SessionUser | null) {
  act(() => nextUser(value));
}
function snapshot(value: UserProfile | null, index = profiles.length - 1) {
  act(() => profiles[index]!.next(value));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('VITE_FIREBASE_MODE', 'emulator');
  profiles = [];
  stopUser = vi.fn();
  vi.mocked(watchCurrentUser).mockImplementation((next, fail) => {
    nextUser = next;
    failUser = fail;
    return stopUser;
  });
  vi.mocked(watchProfile).mockImplementation((uid, next, fail) => {
    const listener = { uid, next, fail, stop: vi.fn() };
    profiles.push(listener);
    return listener.stop;
  });
  vi.mocked(ensureProfile).mockResolvedValue(undefined);
  vi.mocked(registerAccount).mockResolvedValue(undefined);
  vi.mocked(signOutAccount).mockResolvedValue(undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('session lifecycle and isolation', () => {
  it('does not observe or create a profile before email verification', () => {
    show();
    const unverified = { ...a, emailVerified: false };
    user(unverified);
    expect(screen.getByTestId('status')).toHaveTextContent('verification-required');
    expect(watchProfile).not.toHaveBeenCalled();
    expect(ensureProfile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Retry'));
    expect(watchProfile).not.toHaveBeenCalled();
  });
  it('waits for auth and profile before exposing a ready workspace', () => {
    show();
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    user(a);
    expect(screen.getByTestId('status')).toHaveTextContent('profile-loading');
    snapshot(profileFixture());
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    expect(screen.getByTestId('uid')).toHaveTextContent('a');
  });
  it('ignores a previous account callback after switching to a different UID', () => {
    show();
    user(a);
    snapshot(profileFixture('A'));
    user(b);
    expect(profiles[0]!.stop).toHaveBeenCalled();
    expect(screen.getByTestId('profile')).toBeEmptyDOMElement();
    snapshot(profileFixture('Leaked A'), 0);
    expect(screen.getByTestId('profile')).toBeEmptyDOMElement();
    snapshot(profileFixture('B'));
    expect(screen.getByTestId('profile')).toHaveTextContent('B');
  });
  it('creates a missing profile once and preserves the registration name', async () => {
    show();
    user(null);
    fireEvent.click(screen.getByText('Register'));
    user(a);
    snapshot(null);
    snapshot(null);
    await waitFor(() => expect(ensureProfile).toHaveBeenCalledExactlyOnceWith('a', 'Chosen name'));
    expect(registerAccount).toHaveBeenCalledWith(' A@example.test ', 'test-pass-123');
    snapshot(profileFixture('Chosen name'));
    expect(screen.getByTestId('profile')).toHaveTextContent('Chosen name');
  });
  it('does not recreate an existing profile on sign-in', () => {
    show();
    user(a);
    snapshot(profileFixture());
    expect(ensureProfile).not.toHaveBeenCalled();
  });
  it('recovers profile creation without creating another auth account', async () => {
    vi.mocked(ensureProfile).mockRejectedValueOnce({ code: 'unavailable' });
    show();
    user(a);
    snapshot(null);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('profile-error'));
    fireEvent.click(screen.getByText('Retry'));
    snapshot(null);
    snapshot(profileFixture());
    expect(registerAccount).not.toHaveBeenCalled();
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });
  it('clears state immediately while sign-out is pending and ignores late snapshots', async () => {
    let resolve!: () => void;
    vi.mocked(signOutAccount).mockImplementation(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    show();
    user(a);
    snapshot(profileFixture());
    fireEvent.click(screen.getByText('Out'));
    expect(screen.getByTestId('uid')).toBeEmptyDOMElement();
    expect(screen.getByTestId('profile')).toBeEmptyDOMElement();
    snapshot(profileFixture('Late A'));
    expect(screen.getByTestId('profile')).toBeEmptyDOMElement();
    await act(async () => resolve());
    expect(screen.getByTestId('status')).toHaveTextContent('signed-out');
  });
  it('keeps private state locked if sign-out fails and permits retry', async () => {
    vi.mocked(signOutAccount).mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    show();
    user(a);
    snapshot(profileFixture());
    fireEvent.click(screen.getByText('Out'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'));
    expect(screen.getByTestId('profile')).toBeEmptyDOMElement();
    fireEvent.click(screen.getByText('Out'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed-out'));
  });
  it('times out a profile connection and unsubscribes instead of spinning forever', () => {
    vi.useFakeTimers();
    show();
    user(a);
    act(() => vi.advanceTimersByTime(15_001));
    expect(screen.getByTestId('status')).toHaveTextContent('profile-error');
    expect(profiles[0]!.stop).toHaveBeenCalled();
    snapshot(profileFixture());
    expect(screen.getByTestId('status')).toHaveTextContent('profile-error');
  });
  it('ignores a rejected old profile creation after the account changed', async () => {
    let reject!: (error: unknown) => void;
    vi.mocked(ensureProfile).mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    show();
    user(a);
    snapshot(null);
    user(b);
    snapshot(profileFixture('B'));
    await act(async () => reject({ code: 'permission-denied' }));
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    expect(screen.getByTestId('profile')).toHaveTextContent('B');
  });
  it('handles auth observation failure without exposing a previous profile', () => {
    show();
    user(a);
    snapshot(profileFixture());
    act(() => failUser({ code: 'auth/network-request-failed' }));
    expect(screen.getByTestId('status')).toHaveTextContent('error');
    expect(screen.getByTestId('profile')).toBeEmptyDOMElement();
    expect(profiles[0]!.stop).toHaveBeenCalled();
  });
  it('cleans up both listeners on unmount', () => {
    const view = show();
    user(a);
    snapshot(profileFixture());
    view.unmount();
    expect(stopUser).toHaveBeenCalled();
    expect(profiles[0]!.stop).toHaveBeenCalled();
  });
  it('works with React StrictMode effect restart', () => {
    render(
      <StrictMode>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </StrictMode>,
    );
    user(a);
    snapshot(profileFixture());
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    expect(stopUser).toHaveBeenCalled();
  });
  it('leaves disabled preview disconnected', () => {
    vi.stubEnv('VITE_FIREBASE_MODE', 'disabled');
    show();
    expect(screen.getByTestId('status')).toHaveTextContent('disabled');
    expect(watchCurrentUser).not.toHaveBeenCalled();
  });
  it('locks invalid configuration rather than falling back to a private preview', () => {
    vi.stubEnv('VITE_FIREBASE_MODE', 'invalid');
    show();
    expect(screen.getByTestId('status')).toHaveTextContent('error');
    expect(watchCurrentUser).not.toHaveBeenCalled();
  });
});
