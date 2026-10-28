import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GradeBookPage } from './GradeBookPage';
import type { GradeReport } from './gradeContract';

const mocks = vi.hoisted(() => ({
  auth: { currentUser: { uid: 'owner' } },
  readPdf: vi.fn(),
  transaction: vi.fn(),
  snapshot: vi.fn(),
}));
vi.mock('@/features/auth/authContext', () => ({
  useAuth: () => ({ user: { uid: 'owner' }, status: 'ready' }),
}));
vi.mock('@/lib/firebase/client', () => ({
  getFirebaseServices: () => ({ auth: mocks.auth, database: {} }),
}));
vi.mock('./readGradePdf', () => ({ readGradePdf: mocks.readPdf }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(),
  onSnapshot: mocks.snapshot,
  runTransaction: mocks.transaction,
}));

type Snapshot = {
  metadata: { fromCache: boolean; hasPendingWrites: boolean };
  docs: { data: () => { payload: string } }[];
};
let receive: (snapshot: Snapshot) => void;
const report: GradeReport = {
  course: 'Software Engineering',
  year: 2026,
  kind: 'results',
  rows: [
    {
      module: 'Software Engineering 2',
      assessment: 'Overall',
      mark: 80,
      status: 'Pass',
      year: 2026,
    },
  ],
};
const pdf = (name = 'results.pdf') => new File(['PDF'], name, { type: 'application/pdf' });
function selectFiles(files: File[]) {
  fireEvent.change(screen.getByLabelText('Result and progress PDFs'), { target: { files } });
}
function snapshot(reports: GradeReport[]) {
  act(() =>
    receive({
      metadata: { fromCache: false, hasPendingWrites: false },
      docs: reports.map((r) => ({ data: () => ({ payload: JSON.stringify(r) }) })),
    }),
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.snapshot.mockImplementation((_ref: unknown, _options: unknown, next: typeof receive) => {
    receive = next;
    return vi.fn();
  });
  mocks.readPdf.mockResolvedValue(report);
  mocks.transaction.mockResolvedValue(undefined);
  vi.stubGlobal('crypto', {
    subtle: { digest: vi.fn().mockResolvedValue(new Uint8Array(32).buffer) },
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Grade book imports', () => {
  it('rejects more than ten selected PDFs without silently importing a subset', () => {
    render(<GradeBookPage />);
    selectFiles(Array.from({ length: 11 }, (_, n) => pdf(`${n}.pdf`)));
    expect(screen.getByRole('alert')).toHaveTextContent('at most 10 PDFs');
    expect(mocks.readPdf).not.toHaveBeenCalled();
  });
  it('validates the selected academic year before reading a report', () => {
    render(<GradeBookPage />);
    fireEvent.change(screen.getByLabelText('Report academic year'), { target: { value: '1999' } });
    selectFiles([pdf()]);
    expect(screen.getByRole('alert')).toHaveTextContent('academic year from 2000 to 2099');
    expect(mocks.readPdf).not.toHaveBeenCalled();
  });
  it('retains the pending preview when a saved snapshot arrives during an import', async () => {
    let finish!: () => void;
    mocks.transaction.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<GradeBookPage />);
    snapshot([]);
    selectFiles([pdf()]);
    await waitFor(() => expect(mocks.transaction).toHaveBeenCalledOnce());
    snapshot([]);
    expect(screen.getByText('Software Engineering 2')).toBeInTheDocument();
    expect(screen.getByText('Import preview · saving has not been confirmed.')).toBeInTheDocument();
    await act(async () => {
      finish();
    });
    expect(screen.getByText(/Grade reports saved/)).toBeInTheDocument();
    expect(screen.queryByText(/Import preview/)).not.toBeInTheDocument();
  });
  it('stops before another report write when the page is left during saving', async () => {
    mocks.readPdf.mockImplementation((file: File) =>
      Promise.resolve({ ...report, course: file.name }),
    );
    let finish!: () => void;
    mocks.transaction.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const view = render(<GradeBookPage />);
    selectFiles([pdf('first.pdf'), pdf('second.pdf')]);
    await waitFor(() => expect(mocks.transaction).toHaveBeenCalledOnce());
    view.unmount();
    await act(async () => {
      finish();
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });
  it('retains a failed import preview and its error when the saved-data listener updates', async () => {
    mocks.transaction.mockRejectedValue(new Error('Connection lost.'));
    render(<GradeBookPage />);
    snapshot([]);
    selectFiles([pdf()]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Connection lost');
    snapshot([]);
    expect(screen.getByRole('alert')).toHaveTextContent('not a confirmed save');
    expect(screen.getByText('Software Engineering 2')).toBeInTheDocument();
    expect(screen.getByText('Import preview · saving has not been confirmed.')).toBeInTheDocument();
  });
});
