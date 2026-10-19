import { getDocFromServer, runTransaction, Timestamp } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toPlannerInput } from './plannerContract';
import { exampleView } from './planningView';
import { savePlannerRecord } from './plannerService';

const services = vi.hoisted(() => ({ auth: { currentUser: { uid: 'a' } }, database: {} }));
vi.mock('@/lib/firebase/client', () => ({ getFirebaseServices: () => services }));
vi.mock('firebase/firestore', async (original) => ({
  ...(await original<typeof import('firebase/firestore')>()),
  doc: vi.fn(() => ({})),
  runTransaction: vi.fn(),
  getDocFromServer: vi.fn(),
}));

beforeEach(() => vi.resetAllMocks());
describe('planner save confirmation', () => {
  it('returns the committed subject revision rather than its older listener view', async () => {
    const subject = exampleView().subjects[0]!;
    const before = {
      ...toPlannerInput('subjects', subject),
      createdAt: new Timestamp(1, 0),
      updatedAt: new Timestamp(1, 0),
    };
    const after = { ...before, name: 'Updated subject', updatedAt: new Timestamp(2, 0) };
    const transaction = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ exists: () => true, data: () => before })
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ subjectId: subject.id }) })
        .mockResolvedValueOnce({ exists: () => true, data: () => after }),
      set: vi.fn(),
      delete: vi.fn(),
    };
    vi.mocked(runTransaction).mockImplementation(async (_database, callback) =>
      callback(transaction as unknown as Parameters<typeof callback>[0]),
    );
    vi.mocked(getDocFromServer).mockResolvedValue({
      exists: () => true,
      data: () => before,
    } as unknown as Awaited<ReturnType<typeof getDocFromServer>>);
    const saved = await savePlannerRecord('a', 'subjects', {
      ...subject,
      name: after.name,
      revision: before.updatedAt,
    });
    expect(saved.name).toBe(after.name);
    expect(saved.revision?.isEqual(after.updatedAt)).toBe(true);
  });
});
