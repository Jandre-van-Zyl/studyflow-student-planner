import { getDocFromServer, onSnapshot, runTransaction, Timestamp } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileFixture } from '@/test/accountFixtures';
import { ProfileConflictError } from './errors';
import { ensureProfile, saveProfile, watchProfile } from './profileService';

const services = vi.hoisted(() => ({
  auth: { currentUser: { uid: 'a' } as { uid: string } | null },
  database: {},
}));
vi.mock('@/lib/firebase/client', () => ({ getFirebaseServices: () => services }));
vi.mock('firebase/firestore', async (importOriginal) => {
  const original = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...original,
    doc: vi.fn(() => ({ path: 'users/a' })),
    onSnapshot: vi.fn(),
    runTransaction: vi.fn(),
    getDocFromServer: vi.fn(),
  };
});
let transaction: {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};
beforeEach(() => {
  vi.resetAllMocks();
  services.auth.currentUser = { uid: 'a' };
  transaction = {
    get: vi.fn().mockResolvedValue({ exists: () => false }),
    set: vi.fn(),
    update: vi.fn(),
  };
  vi.mocked(runTransaction).mockImplementation(async (_database, callback) =>
    callback(transaction as unknown as Parameters<typeof callback>[0]),
  );
});
describe('profile persistence boundaries', () => {
  it.each(['create', 'save'])(
    'stops %s before its transaction when the server preflight fails',
    async (operation) => {
      vi.mocked(getDocFromServer).mockRejectedValueOnce({ code: 'unavailable' });
      const request =
        operation === 'create'
          ? ensureProfile('a', 'A')
          : saveProfile('a', profileFixture(), new Timestamp(1, 0));
      await expect(request).rejects.toMatchObject({ code: 'unavailable' });
      expect(runTransaction).not.toHaveBeenCalled();
    },
  );
  it('creates a profile using the provided name and seven zero budgets', async () => {
    await ensureProfile('a', ' Chosen ');
    expect(transaction.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        displayName: 'Chosen',
        studyBudgetMinutes: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        timezone: 'Africa/Johannesburg',
      }),
    );
  });
  it('does not overwrite existing profiles during retry or sign-in', async () => {
    transaction.get.mockResolvedValue({ exists: () => true, data: () => profileFixture('Saved') });
    await ensureProfile('a', 'Replacement');
    expect(transaction.set).not.toHaveBeenCalled();
  });
  it('does not overwrite corrupt existing data with a default profile', async () => {
    transaction.get.mockResolvedValue({
      exists: () => true,
      data: () => ({ displayName: 'Broken' }),
    });
    await expect(ensureProfile('a', 'Replacement')).rejects.toThrow();
    expect(transaction.set).not.toHaveBeenCalled();
  });
  it('rejects foreign-UID access before any database call', async () => {
    await expect(ensureProfile('b', 'B')).rejects.toThrow('owner');
    expect(runTransaction).not.toHaveBeenCalled();
  });
  it('cancels an operation when auth changes during its transaction', async () => {
    transaction.get.mockImplementation(async () => {
      services.auth.currentUser = { uid: 'b' };
      return { exists: () => false };
    });
    await expect(ensureProfile('a', 'A')).rejects.toThrow('account changed');
    expect(transaction.set).not.toHaveBeenCalled();
  });
  it('prevents lost updates using the loaded server revision', async () => {
    transaction.get.mockResolvedValue({
      exists: () => true,
      data: () => profileFixture('Updated elsewhere', 2),
    });
    await expect(saveProfile('a', profileFixture(), new Timestamp(1, 0))).rejects.toBeInstanceOf(
      ProfileConflictError,
    );
    expect(transaction.update).not.toHaveBeenCalled();
  });
  it('returns confirmed server data and preserves immutable creation time', async () => {
    const before = profileFixture();
    const after = profileFixture('Saved', 2);
    transaction.get.mockResolvedValue({ exists: () => true, data: () => before });
    vi.mocked(getDocFromServer).mockResolvedValue({
      exists: () => true,
      data: () => after,
    } as unknown as Awaited<ReturnType<typeof getDocFromServer>>);
    expect(await saveProfile('a', after, before.updatedAt)).toEqual(after);
    expect(transaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ displayName: 'Saved' }),
    );
    expect(transaction.update.mock.calls[0]?.[1]).not.toHaveProperty('createdAt');
  });
  it('ignores cache-only, pending-write and previous-owner snapshots', () => {
    let notify!: (snapshot: unknown) => void;
    vi.mocked(onSnapshot).mockImplementation((...args: unknown[]) => {
      notify = args[2] as typeof notify;
      return () => {};
    });
    const next = vi.fn();
    const fail = vi.fn();
    watchProfile('a', next, fail);
    const snapshot = (metadata: Record<string, boolean>) => ({
      metadata,
      exists: () => true,
      data: () => profileFixture(),
    });
    notify(snapshot({ fromCache: true, hasPendingWrites: false }));
    notify(snapshot({ fromCache: false, hasPendingWrites: true }));
    expect(next).not.toHaveBeenCalled();
    notify(snapshot({ fromCache: false, hasPendingWrites: false }));
    expect(next).toHaveBeenCalledOnce();
    services.auth.currentUser = { uid: 'b' };
    notify(snapshot({ fromCache: false, hasPendingWrites: false }));
    expect(next).toHaveBeenCalledOnce();
    expect(fail).not.toHaveBeenCalled();
  });
});
