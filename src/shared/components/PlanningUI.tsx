import { usePlanningPreview } from '@/features/planner/previewContext';
import { addDays, displayDay, monday, sastDay } from '@/features/planner/planningView';

export function SubjectLabel({ id }: { id: string }) {
  const { data } = usePlanningPreview();
  const subject = data.subjects.find((item) => item.id === id);
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="subject-dot" data-colour={subject?.colour ?? 'teal'} aria-hidden="true" />
      {subject?.code ?? 'Unknown subject'}
      {subject?.archived ? ' (archived)' : ''}
    </span>
  );
}
export function WeekControls() {
  const { day, setDay } = usePlanningPreview();
  const start = monday(day);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
      <p className="text-sm font-semibold tabular-nums">
        {displayDay(start)} –{' '}
        {displayDay(addDays(start, 6), { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
      <div className="flex flex-wrap gap-1">
        <button
          className="btn btn-quiet"
          onClick={() => setDay(addDays(day, -7))}
          aria-label="Previous week"
        >
          ←
        </button>
        <button className="btn btn-quiet" onClick={() => setDay(sastDay())}>
          Today
        </button>
        <button
          className="btn btn-quiet"
          onClick={() => setDay(addDays(day, 7))}
          aria-label="Next week"
        >
          →
        </button>
      </div>
    </div>
  );
}
