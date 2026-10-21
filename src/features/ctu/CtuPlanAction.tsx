import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import type { ViewSubject } from '@/features/planner/planningView';
import type { AssessmentType, AssessmentPriority } from '@/shared/types/planner';
import type { CtuItem } from './ctuImportContract';
import { planCtuAssessment } from './ctuPlanningService';

export function CtuPlanAction({
  uid,
  item,
  subjects,
}: {
  uid: string;
  item: CtuItem;
  subjects: ViewSubject[];
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const lock = useRef(false);
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [uid],
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const fields = new FormData(event.currentTarget);
    const abort = new AbortController();
    controller.current = abort;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await planCtuAssessment(
        uid,
        item.id,
        {
          subjectId: String(fields.get('subject') || ''),
          type: String(fields.get('type')) as AssessmentType,
          priority: String(fields.get('priority')) as AssessmentPriority,
          remainingMinutes: Number(fields.get('minutes')),
          planningTime: String(fields.get('time') || ''),
        },
        abort.signal,
      );
      if (!abort.signal.aborted) setSaved(true);
    } catch (reason) {
      if (!abort.signal.aborted)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Could not confirm the save. Keep your choices and retry.',
        );
    } finally {
      lock.current = false;
      if (!abort.signal.aborted) setBusy(false);
    }
  }
  if (saved)
    return (
      <p role="status" className="mt-3">
        Ready for study planning.{' '}
        <Link className="text-link" to="/planner">
          Plan study time
        </Link>
      </p>
    );
  if (!open)
    return (
      <button className="btn btn-secondary mt-3" onClick={() => setOpen(true)}>
        Plan this assessment
      </button>
    );
  return (
    <form className="mt-4 border-l-2 border-line pl-4" onSubmit={submit}>
      <p className="help mb-3">
        Your title and date are already filled in. Add your study estimate once; future syncs update
        this same assessment. Planning uses SAST.
      </p>
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          Subject
          <select name="subject" className="input mt-1" defaultValue="">
            <option value="">Create from this CTU module</option>
            {subjects
              .filter((s) => !s.archived)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
          </select>
        </label>
        <label className="field-label">
          Assessment type
          <select name="type" className="input mt-1" required defaultValue="">
            <option value="" disabled>
              Choose a type
            </option>
            {['Assignment', 'Test', 'Exam', 'Project'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Study minutes remaining
          <input
            name="minutes"
            className="input mt-1"
            type="number"
            min="1"
            max="14400"
            step="1"
            required
          />
        </label>
        <label className="field-label">
          Your priority
          <select name="priority" className="input mt-1" defaultValue="Medium">
            {['High', 'Medium', 'Low'].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        {!item.dueTime && (
          <label className="field-label">
            Planning target time (SAST)
            <input name="time" className="input mt-1" type="time" required />
            <span className="help">
              CTU supplied no time. This is your target, not an official deadline time.
            </span>
          </label>
        )}
        <div className="flex gap-3 sm:col-span-2">
          <button className="btn btn-primary" type="submit">
            {busy ? 'Saving…' : 'Save study plan'}
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="mt-3 text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
