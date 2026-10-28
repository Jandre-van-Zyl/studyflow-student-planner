import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Timestamp } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PreviewContext, type PreviewContextValue } from '@/features/planner/previewContext';
import { EMPTY_VIEW, ZERO_BUDGETS, type ViewAssessment } from '@/features/planner/planningView';
import { CtuSavedPanel } from './CtuSavedPanel';
import { useCtuImports } from './useCtuImports';
import type { CtuItem, CtuSavedView } from './ctuImportContract';
import type { CtuPlannerLink } from './ctuPlanningContract';

vi.mock('./useCtuImports');
vi.mock('@/shared/hooks/useCurrentTime', () => ({
  useCurrentTime: () => Date.parse('2026-10-28T10:00:00+02:00'),
}));
const stamp = Timestamp.fromMillis(0);
function item(id: string, extra: Partial<CtuItem> = {}): CtuItem {
  return {
    id: id.repeat(64),
    kind: 'assessment',
    portalName: 'Student',
    course: 'Course',
    title: `FA ${id}`,
    module: 'KM MDB622',
    sourceId: id,
    dueDate: '2026-10-29',
    dueTime: '14:00',
    upload: 'unknown',
    url: '',
    previousDue: '',
    createdAt: stamp,
    updatedAt: stamp,
    ...extra,
  };
}
function task(source: CtuItem, extra: Partial<ViewAssessment> = {}): ViewAssessment {
  return {
    id: `ctu-${source.id}`,
    subjectId: 'subject',
    title: source.title,
    description: '',
    type: 'Assignment',
    dueAt: '2026-10-29T14:00:00+02:00',
    priority: 'Medium',
    status: 'To Do',
    remainingMinutes: 60,
    archived: false,
    ...extra,
  };
}
function link(source: CtuItem): CtuPlannerLink {
  return {
    id: source.id,
    assessmentId: `ctu-${source.id}`,
    appliedTitle: source.title,
    appliedDue: stamp,
    sourceRevision: stamp,
    conflict: false,
    createdAt: stamp,
    updatedAt: stamp,
  };
}
function show(
  items: CtuItem[],
  options: {
    compact?: boolean;
    unplannedOnly?: boolean;
    tasks?: ViewAssessment[];
    observedIds?: string;
    links?: CtuPlannerLink[];
  } = {},
) {
  const data: CtuSavedView = {
    connection: {
      portalName: 'Student',
      course: 'Course',
      capturedAt: stamp,
      coverage: 'Partial',
      warnings: '',
      createdAt: stamp,
      updatedAt: stamp,
      ...(options.observedIds === undefined ? {} : { observedIds: options.observedIds }),
    },
    items,
    links: options.links,
  };
  vi.mocked(useCtuImports).mockReturnValue({
    uid: 'a',
    enabled: true,
    loading: false,
    error: '',
    retry: vi.fn(),
    data,
  });
  const planner: PreviewContextValue = {
    data: { ...EMPTY_VIEW, assessments: options.tasks ?? [] },
    budgets: ZERO_BUDGETS,
    day: '2026-10-28',
    setDay: vi.fn(),
    saveRecord: vi.fn(),
    available: true,
    preview: false,
  };
  return render(
    <MemoryRouter>
      <PreviewContext.Provider value={planner}>
        <CtuSavedPanel compact={options.compact} unplannedOnly={options.unplannedOnly} />
      </PreviewContext.Provider>
    </MemoryRouter>,
  );
}
beforeEach(() => vi.clearAllMocks());

describe('saved CTU presentation', () => {
  it('prioritises upcoming active work over completed, uploaded, missing and overdue history', () => {
    const completed = item('a', { title: 'Old completed', dueDate: '2026-01-01' });
    const uploaded = item('b', { title: 'Uploaded assignment', upload: 'seen' });
    const missing = item('c', { title: 'Missing source' });
    const overdue = item('d', { title: 'Overdue assignment', dueDate: '2026-10-01' });
    const upcoming = item('e', { title: 'Upcoming assignment' });
    show([completed, uploaded, missing, overdue, upcoming], {
      compact: true,
      tasks: [task(completed, { status: 'Completed', remainingMinutes: 0 })],
      observedIds: [completed, uploaded, overdue, upcoming].map((row) => row.id).join(','),
    });
    expect(screen.queryByText('Old completed')).not.toBeInTheDocument();
    expect(screen.queryByText('Uploaded assignment')).not.toBeInTheDocument();
    expect(screen.queryByText('Missing source')).not.toBeInTheDocument();
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText('Upcoming assignment')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Overdue assignment')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review uploaded work' })).toBeInTheDocument();
  });
  it('retains uploaded records in a separate view without inventing completion or time', () => {
    show([
      item('a', { title: 'SPM622 FA1', upload: 'seen', dueTime: '', previousDue: '2026-10-23' }),
    ]);
    expect(screen.queryByText('SPM622 FA1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Uploaded (1)' }));
    expect(screen.getByText('SPM622 FA1')).toBeInTheDocument();
    expect(screen.getByText(/Time not supplied/)).toBeInTheDocument();
    expect(screen.getByText(/Deadline changed from 2026-10-23/)).toBeInTheDocument();
    expect(screen.getByText(/completion is your decision/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark assignment complete' })).toBeEnabled();
    expect(screen.queryByText('Completed by you')).not.toBeInTheDocument();
  });
  it('keeps completed and no-longer-seen work discoverable without actionable deadline counts', () => {
    const completed = item('a', { title: 'Completed portfolio' });
    const missing = item('b', { title: 'Retained portfolio' });
    show([completed, missing], {
      tasks: [task(completed, { status: 'Completed', remainingMinutes: 0 })],
      observedIds: completed.id,
    });
    expect(screen.getByRole('button', { name: 'Active (0)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Finished (1)' }));
    expect(screen.getByText('Completed portfolio')).toBeInTheDocument();
    expect(screen.getByText('Completed by you')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'All (2)' }));
    expect(screen.getByText('Retained portfolio')).toBeInTheDocument();
    expect(screen.getByText(/Not seen in the latest sync/)).toBeInTheDocument();
  });
  it('filters by module and title, and links an exact planned assessment', () => {
    const first = item('a', { title: 'Database FA1', module: 'Database' });
    const second = item('b', { title: 'Engineering FA1', module: 'Engineering' });
    show([first, second], { tasks: [task(first)], links: [link(first)] });
    fireEvent.change(screen.getByLabelText('Module'), { target: { value: 'Database' } });
    expect(screen.queryByText('Engineering FA1')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open in assessments' })).toHaveAttribute(
      'href',
      `/assessments?assessment=ctu-${first.id}`,
    );
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'missing term' } });
    expect(screen.getByText(/No deadlines match these filters/)).toBeInTheDocument();
  });
  it('lets students plan an unlinked FA directly on Assessments', () => {
    show([item('a', { title: 'SPM622 KM04 FA1' })], { compact: true, unplannedOnly: true });
    fireEvent.click(screen.getByRole('button', { name: 'Plan assignment' }));
    expect(screen.getByLabelText('Work minutes remaining')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Add study estimate' })).not.toBeInTheDocument();
  });
  it('does not expose old course items as current course deadlines', () => {
    show([item('a', { course: 'Previous course', title: 'Previous year work' })]);
    expect(screen.queryByText('Previous year work')).not.toBeInTheDocument();
    expect(screen.getByText(/No deadlines collected for this course yet/)).toBeInTheDocument();
  });
  it('hides data on a load failure and offers retry', () => {
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
  });
});
