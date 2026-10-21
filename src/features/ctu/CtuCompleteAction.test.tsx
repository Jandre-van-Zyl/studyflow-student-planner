import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { PreviewContext, type PreviewContextValue } from '@/features/planner/previewContext';
import type { CtuItem } from './ctuImportContract';
import { CtuCompleteAction } from './CtuCompleteAction';
import { planCtuAssessment } from './ctuPlanningService';
vi.mock('./ctuPlanningService');
const stamp = Timestamp.fromMillis(0);
const item: CtuItem = {
  id: 'a'.repeat(64),
  kind: 'assessment',
  title: 'SE2 FA1',
  module: 'SE2',
  portalName: 'Student',
  course: 'SE2',
  sourceId: '1',
  dueDate: '2026-10-26',
  dueTime: '12:00',
  upload: 'seen',
  url: '',
  previousDue: '',
  createdAt: stamp,
  updatedAt: stamp,
};
function show(source: CtuItem = item) {
  return render(
    <PreviewContext.Provider value={{ available: true } as PreviewContextValue}>
      <CtuCompleteAction uid="owner" item={source} />
    </PreviewContext.Provider>,
  );
}
describe('manual uploaded assignment completion', () => {
  it('never marks work complete automatically and persists only after the student clicks', async () => {
    vi.mocked(planCtuAssessment).mockResolvedValue('ctu-' + item.id);
    show();
    expect(planCtuAssessment).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Mark assignment complete' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Completed by you');
    expect(planCtuAssessment).toHaveBeenCalledWith(
      'owner',
      item.id,
      expect.objectContaining({ type: 'Assignment', completed: true, remainingMinutes: 0 }),
      expect.any(AbortSignal),
    );
    vi.clearAllMocks();
  });
  it('does not offer completion when no uploaded file was observed', () => {
    show({ ...item, upload: 'not-seen' });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('requires an explicit target time for a date-only source without inventing a deadline time', async () => {
    vi.mocked(planCtuAssessment).mockRejectedValue(new Error('Save failed'));
    show({ ...item, dueTime: '' });
    fireEvent.click(screen.getByRole('button', { name: 'Mark assignment complete' }));
    expect(planCtuAssessment).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Your planning target time (SAST)'), {
      target: { value: '17:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mark assignment complete' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Save failed'));
    expect(screen.getByRole('button', { name: 'Mark assignment complete' })).toBeEnabled();
  });
});
