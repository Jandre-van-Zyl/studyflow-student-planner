import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
let service: typeof import('./authService');

const auth = vi.hoisted(() => ({}));
vi.mock('@/lib/firebase/client', () => ({ getFirebaseServices: () => ({ auth }) }));
vi.mock('firebase/auth', () => ({
  browserSessionPersistence: { type: 'SESSION' },
  setPersistence: vi.fn().mockResolvedValue(undefined),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));
beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  service = await import('./authService');
  vi.mocked(onAuthStateChanged).mockReturnValue(vi.fn());
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
    expect(onAuthStateChanged).not.toHaveBeenCalled();
  });
  it('unsubscribes an attached observer', async () => {
    const unsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValue(unsubscribe);
    const stop = service.watchCurrentUser(vi.fn(), vi.fn());
    await vi.waitFor(() => expect(onAuthStateChanged).toHaveBeenCalledOnce());
    stop();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
