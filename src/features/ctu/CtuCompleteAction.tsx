import { useContext, useEffect, useRef, useState } from 'react';
import { PreviewContext } from '@/features/planner/previewContext';
import type { ViewAssessment } from '@/features/planner/planningView';
import type { CtuItem } from './ctuImportContract';
import { planCtuAssessment } from './ctuPlanningService';
import { isCtuAssignment } from './ctuAssessmentKind';
import { SuccessCheck } from '@/shared/components/SuccessCheck';

export function CtuCompleteAction({
  uid,
  item,
  task,
}: {
  uid: string;
  item: CtuItem;
  task?: ViewAssessment;
}) {
  const planner = useContext(PreviewContext);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [time, setTime] = useState('');
  const [showTime, setShowTime] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const locked = useRef(false);
  useEffect(() => () => controller.current?.abort(), [uid]);
  if (saved || (task?.type === 'Assignment' && task.status === 'Completed'))
    return (
      <p role="status" className="mt-3">
        <SuccessCheck>Completed by you</SuccessCheck>
      </p>
    );
  if (
    !planner?.available ||
    item.upload !== 'seen' ||
    !(task ? task.type === 'Assignment' : isCtuAssignment(item.title))
  )
    return null;
  if (task?.archived) return null;
  async function complete() {
    if (locked.current) return;
    if (!task && !item.dueTime && !time) {
      setShowTime(true);
      return;
    }
    const abort = new AbortController();
    controller.current = abort;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      if (task)
        await planner!.saveRecord('assessments', {
          ...task,
          status: 'Completed',
          remainingMinutes: 0,
        });
      else
        await planCtuAssessment(
          uid,
          item.id,
          {
            subjectId: '',
            type: 'Assignment',
            priority: 'Medium',
            remainingMinutes: 0,
            planningTime: time,
            completed: true,
          },
          abort.signal,
        );
      if (!abort.signal.aborted) setSaved(true);
    } catch (failure) {
      if (!abort.signal.aborted)
        setError(
          failure instanceof Error
            ? failure.message
            : 'Completion could not be saved. Please retry.',
        );
    } finally {
      locked.current = false;
      if (!abort.signal.aborted) setBusy(false);
    }
  }
  return (
    <div className="mt-3">
      {showTime && (
        <label className="mb-3 block max-w-[260px] text-sm">
          Your planning target time (SAST)
          <input
            type="time"
            aria-label="Your planning target time (SAST)"
            value={time}
            disabled={busy}
            onChange={(event) => setTime(event.target.value)}
          />
          <span className="help">CTU supplied a date only. This time is your personal target.</span>
        </label>
      )}
      <button
        className="btn btn-secondary"
        disabled={busy || (showTime && !time)}
        onClick={() => void complete()}
      >
        {busy ? 'Saving completion…' : 'Mark assignment complete'}
      </button>
      <p className="help mt-1">
        Upload found on MyCampusOnline. Mark complete when you are finished.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
