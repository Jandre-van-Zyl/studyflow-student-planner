import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/features/auth/authContext';
import { PreviewContext } from '@/features/planner/previewContext';
import { exampleView, ZERO_BUDGETS, type PlanningView } from '@/features/planner/planningView';
import type { StudyBudgetMinutes } from '@/shared/types/planner';
import { authFixture, profileFixture } from '@/test/accountFixtures';
import { DashboardPage } from './DashboardPage';

vi.mock('@/shared/hooks/useCurrentTime', () => ({
  useCurrentTime: () => Date.parse('2026-10-21T12:00:00+02:00'),
}));

function renderDashboard(data: PlanningView, budgets: StudyBudgetMinutes = ZERO_BUDGETS) {
  function Workspace() {
    const [day, setDay] = useState('2026-10-21');
    return (
      <PreviewContext.Provider
        value={{
          data,
          budgets,
          day,
          setDay,
          preview: false,
          available: true,
          saveRecord: vi.fn().mockResolvedValue(undefined),
        }}
      >
        <DashboardPage />
      </PreviewContext.Provider>
    );
  }
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authFixture({ status: 'ready', profile: profileFixture() })}>
        <Workspace />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('integrated dashboard recommendations and workload', () => {
  it('shows the shorter tied assessment as quick, without changing its displayed SAST deadline', () => {
    const data = exampleView();
    const source = data.assessments[0]!;
    data.assessments = [
      {
        ...source,
        id: 'long',
        title: 'Long draft',
        dueAt: '2026-10-22T12:00:00+02:00',
        remainingMinutes: 120,
      },
      {
        ...source,
        id: 'short',
        title: 'Short revision',
        dueAt: '2026-10-22T12:00:00+02:00',
        remainingMinutes: 15,
      },
    ];
    renderDashboard(data);
    const advice = screen.getByRole('heading', { name: 'Where to start' }).closest('section')!;
    expect(within(advice).getByRole('heading', { name: 'Short revision' })).toBeVisible();
    expect(within(advice).getByText('Quick task')).toBeVisible();
    expect(within(advice).getByText(/Due within 24 hours.*high priority/)).toBeVisible();
    expect(within(advice).getByText(/12:00 SAST/)).toBeVisible();
    expect(within(advice).getByRole('link', { name: /Review assessments/ })).toHaveAttribute(
      'href',
      '/assessments',
    );
  });

  it('does not label a higher-priority long task as quick', () => {
    const data = exampleView();
    const source = data.assessments[0]!;
    data.assessments = [
      {
        ...source,
        id: 'high',
        title: 'High priority project',
        dueAt: '2026-10-22T12:00:00+02:00',
        remainingMinutes: 120,
      },
      {
        ...source,
        id: 'low',
        title: 'Quick low task',
        priority: 'Low',
        dueAt: '2026-10-22T12:00:00+02:00',
        remainingMinutes: 15,
      },
    ];
    renderDashboard(data);
    const advice = screen.getByRole('heading', { name: 'Where to start' }).closest('section')!;
    expect(within(advice).getByRole('heading', { name: 'High priority project' })).toBeVisible();
    expect(within(advice).queryByText('Quick task')).not.toBeInTheDocument();
  });

  it('uses the selected SAST day, retains Done allocation, excludes Cancelled and updates the budget warning', () => {
    const data = exampleView();
    const block = data.blocks[0]!;
    data.classes[0]!.weekday = 3;
    data.blocks = [
      { ...block, startAt: '2026-10-20T22:15:00Z', endAt: '2026-10-20T23:00:00Z', status: 'Done' },
      {
        ...block,
        id: 'planned',
        startAt: '2026-10-21T10:00:00+02:00',
        endAt: '2026-10-21T10:45:00+02:00',
      },
      {
        ...block,
        id: 'cancelled',
        startAt: '2026-10-21T11:00:00+02:00',
        endAt: '2026-10-21T12:00:00+02:00',
        status: 'Cancelled',
      },
    ];
    renderDashboard(data, { ...ZERO_BUDGETS, 3: 60 });
    expect(screen.getByText('90 min reserved')).toBeVisible();
    expect(screen.getByText(/30 min over budget/)).toBeVisible();
    fireEvent.change(screen.getByLabelText('Agenda date'), { target: { value: '2026-10-22' } });
    expect(screen.getByText('0 min reserved')).toBeVisible();
    expect(screen.queryByText(/min over budget/)).not.toBeInTheDocument();
    expect(screen.getByText('0 min available for study.')).toBeVisible();
  });

  it('handles empty recommendations and a positive allocation against zero budget', () => {
    const data = exampleView();
    data.assessments = data.assessments.map((item) => ({ ...item, archived: true }));
    data.blocks = [
      {
        ...data.blocks[0]!,
        startAt: '2026-10-21T10:00:00+02:00',
        endAt: '2026-10-21T10:45:00+02:00',
      },
    ];
    renderDashboard(data);
    expect(screen.getByText(/No incomplete assessments/)).toBeVisible();
    expect(screen.queryByText('Quick task')).not.toBeInTheDocument();
    expect(screen.getByText(/45 min over budget/)).toBeVisible();
    expect(
      screen.getByRole('img', { name: '45 minutes reserved against a 0 minute budget' }),
    ).toBeVisible();
  });
});
