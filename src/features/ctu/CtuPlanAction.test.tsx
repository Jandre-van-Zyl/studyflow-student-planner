import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Timestamp } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { CtuPlanAction } from './CtuPlanAction';
import { planCtuAssessment } from './ctuPlanningService';
vi.mock('./ctuPlanningService', () => ({ planCtuAssessment: vi.fn() }));
const stamp = Timestamp.fromMillis(0);
const item = {
  id: 'a'.repeat(64),
  kind: 'assessment' as const,
  portalName: 'Example',
  course: 'Course',
  title: 'Portfolio',
  module: 'Module',
  sourceId: '1',
  dueDate: '2026-10-26',
  dueTime: '',
  upload: 'unknown' as const,
  url: '',
  previousDue: '',
  createdAt: stamp,
  updatedAt: stamp,
};
function open() {
  const view = render(
    <MemoryRouter>
      <CtuPlanAction uid="a" item={item} subjects={[]} />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Plan this assessment' }));
  fireEvent.change(screen.getByLabelText('Assessment type'), { target: { value: 'Project' } });
  fireEvent.change(screen.getByLabelText('Study minutes remaining'), { target: { value: '90' } });
  fireEvent.change(screen.getByLabelText(/Planning target time/), { target: { value: '18:00' } });
  return view;
}
describe('CTU planning activation', () => {
  it('defaults an FA to Assignment and submits work time', async () => {
    vi.mocked(planCtuAssessment).mockResolvedValue('ctu-task');
    render(
      <MemoryRouter>
        <CtuPlanAction uid="a" item={{ ...item, title: 'KM-05_FA1 MDB622' }} subjects={[]} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Plan assignment' }));
    expect(screen.getByLabelText('Assessment type')).toHaveValue('Assignment');
    expect(screen.queryByText(/study estimate/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Work minutes remaining'), { target: { value: '45' } });
    fireEvent.change(screen.getByLabelText(/Planning target time/), { target: { value: '18:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save assignment plan' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Ready for your planner'),
    );
    expect(planCtuAssessment).toHaveBeenLastCalledWith(
      'a',
      item.id,
      {
        subjectId: '',
        type: 'Assignment',
        priority: 'Medium',
        remainingMinutes: 45,
        planningTime: '18:00',
      },
      expect.any(AbortSignal),
    );
    expect(screen.getByRole('link', { name: 'Plan assignment work' })).toHaveAttribute(
      'href',
      '/planner',
    );
  });
  it('supplies personal choices once and offers the normal planner after server confirmation', async () => {
    vi.mocked(planCtuAssessment).mockResolvedValue('ctu-task');
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Save study plan' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Ready for your planner'),
    );
    expect(planCtuAssessment).toHaveBeenCalledWith(
      'a',
      item.id,
      {
        subjectId: '',
        type: 'Project',
        priority: 'Medium',
        remainingMinutes: 90,
        planningTime: '18:00',
      },
      expect.any(AbortSignal),
    );
    expect(screen.getByRole('link', { name: 'Plan study time' })).toHaveAttribute(
      'href',
      '/planner',
    );
  });
  it('retains input after failure and aborts an unmounted operation', async () => {
    vi.mocked(planCtuAssessment).mockRejectedValue(new Error('Offline. Retry.'));
    const view = open();
    fireEvent.click(screen.getByRole('button', { name: 'Save study plan' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Offline'));
    expect(screen.getByLabelText('Study minutes remaining')).toHaveValue(90);
    const signal = vi.mocked(planCtuAssessment).mock.calls.at(-1)![3]!;
    view.unmount();
    expect(signal.aborted).toBe(true);
  });
});
