import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/features/auth/authContext';
import { authFixture, profileFixture } from '@/test/accountFixtures';
import { CtuSyncPage } from './CtuSyncPage';
import { APP_ORIGIN, CTU_CHANNEL, combinePortalPages } from './portalContract';

vi.mock('./CtuSavedPanel', () => ({ CtuSavedPanel: () => null }));
vi.mock('./ctuImportService', async (original) => ({
  ...(await original<typeof import('./ctuImportService')>()),
  saveCtuImport: vi.fn(),
}));
import { saveCtuImport } from './ctuImportService';
afterEach(() => vi.unstubAllEnvs());

const value = authFixture({
  status: 'ready',
  mode: 'cloud',
  user: { uid: 'student-a', email: 'student@example.test', emailVerified: true },
  profile: profileFixture(),
});
function deliver(data: unknown, origin = APP_ORIGIN) {
  act(() => window.dispatchEvent(new MessageEvent('message', { data, origin, source: window })));
}
function show() {
  return render(
    <AuthContext.Provider value={value}>
      <CtuSyncPage />
    </AuthContext.Provider>,
  );
}
describe('CTU private preview', () => {
  it('hides the previous account preview immediately when the authenticated UID changes', () => {
    const post = vi.spyOn(window, 'postMessage');
    const view = show();
    const probe = post.mock.calls[0]![0] as { requestId: string };
    deliver({ channel: CTU_CHANNEL, type: 'ready', requestId: probe.requestId, version: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Connect CTU' }));
    const request = post.mock.calls.at(-1)![0] as { requestId: string };
    const snapshot = combinePortalPages([
      {
        kind: 'home',
        portalName: 'Previous Portal Student',
        course: '',
        modules: [],
        assessments: [],
        documents: [],
        resources: [],
        warnings: [],
      },
    ]);
    deliver({ channel: CTU_CHANNEL, type: 'result', requestId: request.requestId, snapshot });
    expect(screen.getByText('Previous Portal Student')).toBeInTheDocument();
    view.rerender(
      <AuthContext.Provider
        value={{
          ...value,
          user: { uid: 'student-b', email: 'other@example.test', emailVerified: true },
        }}
      >
        <CtuSyncPage />
      </AuthContext.Provider>,
    );
    expect(screen.queryByText('Previous Portal Student')).not.toBeInTheDocument();
    deliver({ channel: CTU_CHANNEL, type: 'result', requestId: request.requestId, snapshot });
    expect(screen.queryByText('Previous Portal Student')).not.toBeInTheDocument();
  });
  it('ignores a delayed result after cancellation and sends the cancellation request', () => {
    const post = vi.spyOn(window, 'postMessage');
    show();
    const probe = post.mock.calls[0]![0] as { requestId: string };
    deliver({ channel: CTU_CHANNEL, type: 'ready', requestId: probe.requestId, version: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Connect CTU' }));
    const request = post.mock.calls.at(-1)![0] as { requestId: string };
    fireEvent.click(screen.getByRole('button', { name: 'Cancel collection' }));
    expect(post).toHaveBeenLastCalledWith(
      { channel: CTU_CHANNEL, type: 'cancel', requestId: request.requestId },
      APP_ORIGIN,
    );
    deliver({
      channel: CTU_CHANNEL,
      type: 'result',
      requestId: request.requestId,
      snapshot: combinePortalPages([]),
    });
    expect(screen.queryByRole('heading', { name: /Assessment preview/ })).not.toBeInTheDocument();
  });
  it('blocks collection without an admitted cloud session', () => {
    render(
      <AuthContext.Provider value={authFixture({ status: 'disabled', mode: 'disabled' })}>
        <CtuSyncPage />
      </AuthContext.Provider>,
    );
    expect(screen.queryByRole('button', { name: 'Connect CTU' })).not.toBeInTheDocument();
  });
  it('ignores wrong origins and nonces, then previews only the current request', () => {
    const post = vi.spyOn(window, 'postMessage');
    show();
    const probe = post.mock.calls[0]![0] as { requestId: string };
    deliver(
      { channel: CTU_CHANNEL, type: 'ready', requestId: probe.requestId, version: 1 },
      'https://evil.test',
    );
    expect(screen.getByRole('button', { name: 'Connect CTU' })).toBeDisabled();
    deliver({ channel: CTU_CHANNEL, type: 'ready', requestId: probe.requestId, version: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Connect CTU' }));
    const request = post.mock.calls.at(-1)![0] as { requestId: string };
    const snapshot = combinePortalPages([
      {
        kind: 'home',
        portalName: 'Example Student',
        course: '',
        modules: [],
        assessments: [
          {
            module: 'KM-03',
            title: 'Real deadline preview',
            due: '2026-10-21',
            sourceId: null,
            submitted: false,
          },
        ],
        documents: [],
        resources: [],
        warnings: [],
      },
    ]);
    deliver({ channel: CTU_CHANNEL, type: 'result', requestId: 'wrong', snapshot });
    expect(screen.queryByText('Real deadline preview')).not.toBeInTheDocument();
    deliver({ channel: CTU_CHANNEL, type: 'result', requestId: request.requestId, snapshot });
    expect(screen.getByText('Real deadline preview')).toBeInTheDocument();
    expect(screen.getByText(/date only/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save|import/i })).not.toBeInTheDocument();
    expect(screen.getByText('Example Student')).toBeInTheDocument();
  });
  it('rejects invalid helper data and does not leave stale preview data', () => {
    const post = vi.spyOn(window, 'postMessage');
    show();
    const probe = post.mock.calls[0]![0] as { requestId: string };
    deliver({ channel: CTU_CHANNEL, type: 'ready', requestId: probe.requestId, version: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Connect CTU' }));
    const request = post.mock.calls.at(-1)![0] as { requestId: string };
    deliver({
      channel: CTU_CHANNEL,
      type: 'result',
      requestId: request.requestId,
      snapshot: { version: 99 },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid|unsupported|unexpected/i);
  });
});

describe('automatic account-scoped saving', () => {
  it('saves a valid response without an identity checkbox or a second confirmation', async () => {
    vi.stubEnv('VITE_CTU_SAVE_ENABLED', 'true');
    vi.mocked(saveCtuImport).mockResolvedValue({ added: 2, updated: 0, unchanged: 0 });
    const post = vi.spyOn(window, 'postMessage');
    show();
    const probe = post.mock.calls[0]![0] as { requestId: string };
    deliver({ channel: CTU_CHANNEL, type: 'ready', requestId: probe.requestId, version: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Connect CTU' }));
    const request = post.mock.calls.at(-1)![0] as { requestId: string };
    const snapshot = combinePortalPages([]);
    await act(async () =>
      deliver({ channel: CTU_CHANNEL, type: 'result', requestId: request.requestId, snapshot }),
    );
    expect(saveCtuImport).toHaveBeenCalledWith('student-a', snapshot, expect.any(AbortSignal));
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText(/Saved to your StudyFlow account: 2 new/)).toBeInTheDocument();
  });
  it('aborts the initiating account save and ignores its completion after account switch', async () => {
    vi.stubEnv('VITE_CTU_SAVE_ENABLED', 'true');
    let finish!: (v: { added: number; updated: number; unchanged: number }) => void;
    vi.mocked(saveCtuImport).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const post = vi.spyOn(window, 'postMessage');
    const view = show();
    const probe = post.mock.calls[0]![0] as { requestId: string };
    deliver({ channel: CTU_CHANNEL, type: 'ready', requestId: probe.requestId, version: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Connect CTU' }));
    const request = post.mock.calls.at(-1)![0] as { requestId: string };
    deliver({
      channel: CTU_CHANNEL,
      type: 'result',
      requestId: request.requestId,
      snapshot: combinePortalPages([]),
    });
    const signal = vi.mocked(saveCtuImport).mock.calls.at(-1)![2]!;
    view.rerender(
      <AuthContext.Provider
        value={{
          ...value,
          user: { uid: 'student-b', email: 'other@example.test', emailVerified: true },
        }}
      >
        <CtuSyncPage />
      </AuthContext.Provider>,
    );
    expect(signal.aborted).toBe(true);
    await act(async () => finish({ added: 2, updated: 0, unchanged: 0 }));
    expect(screen.queryByText(/Saved to your StudyFlow account:/)).not.toBeInTheDocument();
  });
  it('retains collected information and offers a retry when saving fails', async () => {
    vi.stubEnv('VITE_CTU_SAVE_ENABLED', 'true');
    vi.mocked(saveCtuImport).mockRejectedValue(new Error('unavailable'));
    const post = vi.spyOn(window, 'postMessage');
    show();
    const probe = post.mock.calls[0]![0] as { requestId: string };
    deliver({ channel: CTU_CHANNEL, type: 'ready', requestId: probe.requestId, version: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Connect CTU' }));
    const request = post.mock.calls.at(-1)![0] as { requestId: string };
    await act(async () =>
      deliver({
        channel: CTU_CHANNEL,
        type: 'result',
        requestId: request.requestId,
        snapshot: combinePortalPages([]),
      }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/update were not fully confirmed/);
    expect(screen.getByRole('button', { name: 'Retry saving CTU information' })).toBeEnabled();
    expect(screen.queryByText(/Saved to your StudyFlow account:/)).not.toBeInTheDocument();
  });
});
