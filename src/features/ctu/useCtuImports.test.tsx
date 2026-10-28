import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '@/features/auth/authContext';
import { authFixture } from '@/test/accountFixtures';
import { EMPTY_CTU } from './ctuImportContract';
import { watchCtuImports } from './ctuImportService';
import { CTU_LOAD_TIMEOUT_MS, useCtuImports } from './useCtuImports';

vi.mock('@/features/auth/authContext', async (original) => ({
  ...(await original<typeof import('@/features/auth/authContext')>()),
  useAuth: vi.fn(),
}));
vi.mock('./ctuImportService', () => ({ watchCtuImports: vi.fn() }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue(
    authFixture({
      status: 'ready',
      mode: 'emulator',
      user: { uid: 'student-a', email: 'a@example.test', emailVerified: true },
    }),
  );
});
afterEach(() => vi.useRealTimers());

describe('saved CTU subscriptions', () => {
  it('times out an unconfirmed server load, unsubscribes and permits a fresh retry', () => {
    const stop = vi.fn();
    vi.mocked(watchCtuImports).mockReturnValue(stop);
    const { result } = renderHook(useCtuImports);
    expect(result.current.loading).toBe(true);
    const oldNext = vi.mocked(watchCtuImports).mock.calls[0]![1];
    act(() => vi.advanceTimersByTime(CTU_LOAD_TIMEOUT_MS));
    expect(stop).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain('retry');
    act(() => oldNext(EMPTY_CTU));
    expect(result.current.error).toContain('retry');
    act(() => result.current.retry());
    expect(result.current.loading).toBe(true);
    expect(watchCtuImports).toHaveBeenCalledTimes(2);
    act(() => vi.mocked(watchCtuImports).mock.calls[1]![1](EMPTY_CTU));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
  });
  it('turns a synchronous subscription error into a recoverable state', () => {
    vi.mocked(watchCtuImports).mockImplementation(() => {
      throw new Error('session changed');
    });
    const { result } = renderHook(useCtuImports);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain('retry');
    expect(result.current.data).toBe(EMPTY_CTU);
  });
  it('clears the loading timeout after confirmed data, and ignores the old account callback', () => {
    const stop = vi.fn();
    vi.mocked(watchCtuImports).mockReturnValue(stop);
    const { result, rerender } = renderHook(useCtuImports);
    const oldNext = vi.mocked(watchCtuImports).mock.calls[0]![1];
    act(() => oldNext(EMPTY_CTU));
    act(() => vi.advanceTimersByTime(CTU_LOAD_TIMEOUT_MS));
    expect(result.current.error).toBe('');
    vi.mocked(useAuth).mockReturnValue(
      authFixture({
        status: 'ready',
        mode: 'emulator',
        user: { uid: 'student-b', email: 'b@example.test', emailVerified: true },
      }),
    );
    rerender();
    expect(result.current.loading).toBe(true);
    expect(stop).toHaveBeenCalled();
    act(() => oldNext(EMPTY_CTU));
    expect(result.current.uid).toBe('student-b');
    expect(result.current.loading).toBe(true);
  });
});
