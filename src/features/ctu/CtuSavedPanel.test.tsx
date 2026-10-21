import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Timestamp } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { CtuSavedPanel } from './CtuSavedPanel';
import { useCtuImports } from './useCtuImports';
vi.mock('./useCtuImports');
describe('saved CTU presentation', () => {
  it('shows date precision, changed dates and source observations without invented completion', () => {
    const stamp = Timestamp.fromMillis(0);
    vi.mocked(useCtuImports).mockReturnValue({
      uid: 'a',
      enabled: true,
      loading: false,
      error: '',
      retry: vi.fn(),
      data: {
        connection: {
          portalName: 'Student',
          course: 'Course',
          capturedAt: stamp,
          coverage: 'Partial',
          warnings: '',
          createdAt: stamp,
          updatedAt: stamp,
        },
        items: [
          {
            id: 'a'.repeat(64),
            kind: 'assessment',
            portalName: 'Student',
            course: 'Course',
            title: 'Portfolio',
            module: 'KM MDB622',
            sourceId: '1',
            dueDate: '2026-10-26',
            dueTime: '',
            upload: 'seen',
            url: '',
            previousDue: '2026-10-23',
            createdAt: stamp,
            updatedAt: stamp,
          },
        ],
      },
    });
    render(
      <MemoryRouter>
        <CtuSavedPanel />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Time not supplied/)).toBeInTheDocument();
    expect(screen.getByText(/Deadline changed from 2026-10-23/)).toBeInTheDocument();
    expect(screen.getByText(/completion is your decision/)).toBeInTheDocument();
    expect(screen.queryByText(/23:59|100%/)).not.toBeInTheDocument();
  });
  it('hides stale data on a load failure and offers retry', () => {
    vi.mocked(useCtuImports).mockReturnValue({
      uid: 'a',
      enabled: true,
      loading: false,
      error: 'Cannot load',
      retry: vi.fn(),
      data: { items: [], connection: null },
    });
    render(
      <MemoryRouter>
        <CtuSavedPanel />
      </MemoryRouter>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Cannot load');
    expect(screen.getByRole('button', { name: 'Retry CTU loading' })).toBeEnabled();
    expect(screen.queryByText(/Saved CTU deadlines/)).not.toBeInTheDocument();
  });
});
