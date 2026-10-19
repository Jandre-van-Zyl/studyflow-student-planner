import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  reload,
  getIdToken,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
let service: typeof import('./authService');

const auth = vi.hoisted(() => ({
  currentUser: null as null | { uid: string; email: string; emailVerified: boolean },
}));
vi.mock('@/lib/firebase/client', () => ({ getFirebaseServices: () => ({ auth }) }));
vi.mock('firebase/auth', () => ({
  browserSessionPersistence: { type: 'SESSION' },
  setPersistence: vi.fn().mockResolvedValue(undefined),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onIdTokenChanged: vi.fn(),
  reload: vi.fn().mockResolvedValue(undefined),
  getIdToken: vi.fn().mockResolvedValue('synthetic-token'),
  sendEmailVerification: vi.fn().mockResolvedValue(undefined),
}));
beforeEach(async () => {
  vi.clearAllMocks();
  auth.currentUser = null;
  vi.resetModules();
  service = await import('./authService');
  vi.mocked(onIdTokenChanged).mockReturnValue(vi.fn());
});
describe('Firebase authentication adapter', () => {
  it('selects session persistence before registering a trimmed email', async () => {
    await service.registerAccount(' a@example.test ', 'demo-pass-123');
    expect(setPersistence).toHaveBeenCalledWith(auth, { type: 'SESSION' });
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      'a@example.test',
      'demo-pass-123',
    );
  });
  it('signs in and signs out through the same shared Auth instance', async () => {
    await service.signInAccount(' a@example.test ', 'password');
    await service.signOutAccount();
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'a@example.test', 'password');
    expect(signOut).toHaveBeenCalledWith(auth);
  });
  it('does not leave an observer attached after an immediate unmount', async () => {
    const stop = service.watchCurrentUser(vi.fn(), vi.fn());
    stop();
    await Promise.resolve();
    expect(onIdTokenChanged).not.toHaveBeenCalled();
  });
  it('unsubscribes an attached observer', async () => {
    const unsubscribe = vi.fn();
    vi.mocked(onIdTokenChanged).mockReturnValue(unsubscribe);
    const stop = service.watchCurrentUser(vi.fn(), vi.fn());
    await vi.waitFor(() => expect(onIdTokenChanged).toHaveBeenCalledOnce());
    stop();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});

describe('verification adapter', () => {
  it('sends only on explicit request using the current user', async () => {
    auth.currentUser = { uid: 'a', email: 'a@example.test', emailVerified: false };
    await service.sendVerificationEmail();
    expect(sendEmailVerification).toHaveBeenCalledExactlyOnceWith(auth.currentUser);
    auth.currentUser.emailVerified = true;
    await service.sendVerificationEmail();
    expect(sendEmailVerification).toHaveBeenCalledTimes(1);
  });
  it('reloads identity and forces fresh verification claims before returning it', async () => {
    auth.currentUser = { uid: 'a', email: 'a@example.test', emailVerified: true };
    expect(await service.refreshAccount()).toEqual(auth.currentUser);
    expect(reload).toHaveBeenCalledWith(auth.currentUser);
    expect(getIdToken).toHaveBeenCalledWith(auth.currentUser, true);
  });
  it('does not refresh or return an identity that changed during reload', async () => {
    auth.currentUser = { uid: 'a', email: 'a@example.test', emailVerified: false };
    vi.mocked(reload).mockImplementationOnce(async () => {
      auth.currentUser = null;
    });
    expect(await service.refreshAccount()).toBeNull();
    expect(getIdToken).not.toHaveBeenCalled();
  });
});
