import { beforeEach, describe, expect, it, vi } from 'vitest';
import { doc, onSnapshot } from 'firebase/firestore';
import { activeMembership, membershipEmail, watchMembership } from './membershipService';
vi.mock('@/lib/firebase/client', () => ({
  getFirebaseServices: () => ({ database: 'synthetic-db' }),
}));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => 'reference'),
  onSnapshot: vi.fn(() => vi.fn()),
}));
beforeEach(() => vi.clearAllMocks());
describe('approved student document boundary', () => {
  it('normalizes case without conflating distinct addresses or trimming token data', () => {
    expect(membershipEmail('STUDENT+ONE@EXAMPLE.TEST')).toBe('student+one@example.test');
    for (const email of [
      null,
      'a/b@example.test',
      ' a@example.test',
      'a@example.test ',
      'bad',
      'a@b',
      'a'.repeat(250) + '@example.test',
    ])
      expect(membershipEmail(email)).toBeNull();
  });
  it.each([
    undefined,
    null,
    {},
    { active: false },
    { active: 'true' },
    { active: true, role: 'admin' },
  ])('denies malformed or inactive data: %j', (value) => {
    expect(activeMembership(value)).toBe(false);
  });
  it('accepts only the exact active schema', () =>
    expect(activeMembership({ active: true })).toBe(true));
  it('never subscribes before verification', () => {
    const next = vi.fn();
    watchMembership({ uid: 'a', email: 'a@example.test', emailVerified: false }, next, vi.fn());
    expect(next).toHaveBeenCalledWith('denied');
    expect(onSnapshot).not.toHaveBeenCalled();
  });
  it('requires server-confirmed approval, observes revocation, and passes through failures/cleanup', () => {
    const next = vi.fn(),
      fail = vi.fn(),
      stop = vi.fn();
    vi.mocked(onSnapshot).mockReturnValueOnce(stop);
    expect(
      watchMembership({ uid: 'a', email: 'A@EXAMPLE.TEST', emailVerified: true }, next, fail),
    ).toBe(stop);
    expect(doc).toHaveBeenCalledWith('synthetic-db', 'approvedStudents', 'a@example.test');
    const callback = vi.mocked(onSnapshot).mock.calls[0]![2] as unknown as (
      snapshot: unknown,
    ) => void;
    callback({
      data: () => ({ active: true }),
      metadata: { fromCache: true, hasPendingWrites: false },
    });
    expect(next).toHaveBeenLastCalledWith('checking');
    callback({
      data: () => ({ active: true }),
      metadata: { fromCache: false, hasPendingWrites: true },
    });
    expect(next).toHaveBeenLastCalledWith('checking');
    callback({
      data: () => ({ active: true }),
      metadata: { fromCache: false, hasPendingWrites: false },
    });
    expect(next).toHaveBeenLastCalledWith('approved');
    callback({
      data: () => ({ active: false }),
      metadata: { fromCache: false, hasPendingWrites: false },
    });
    expect(next).toHaveBeenLastCalledWith('denied');
    expect(vi.mocked(onSnapshot).mock.calls[0]![3]).toBe(fail);
  });
});
