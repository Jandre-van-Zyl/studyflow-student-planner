import { Link } from 'react-router';
import { useContext } from 'react';
import { PreviewContext } from '@/features/planner/previewContext';
import { CtuPlanAction } from './CtuPlanAction';
import { addDays, sastDay } from '@/features/planner/planningView';
import { useCurrentTime } from '@/shared/hooks/useCurrentTime';
import { useCtuImports } from './useCtuImports';
import { isCtuAssignment } from './ctuAssessmentKind';
import { CtuCompleteAction } from './CtuCompleteAction';
import { SuccessCheck } from '@/shared/components/SuccessCheck';

export function CtuSavedPanel({
  compact = false,
  unplannedOnly = false,
}: {
  compact?: boolean;
  unplannedOnly?: boolean;
}) {
  const { uid, enabled, data, loading, error, retry } = useCtuImports();
  const planner = useContext(PreviewContext);
  const now = useCurrentTime();
  if (!enabled) return null;
  if (error)
    return (
      <section className="notice mt-6">
        <p role="alert">{error}</p>
        <button className="btn btn-secondary mt-3" onClick={retry}>
          Retry CTU loading
        </button>
      </section>
    );
  if (loading)
    return (
      <p role="status" className="mt-6">
        Loading saved CTU information…
      </p>
    );
  if (!data.connection)
    return (
      <section className="mt-6 border-y border-line py-5">
        <h2>Your CTU deadlines</h2>
        <p className="mt-2">
          Connect CTU to bring your modules and known deadlines into this account.
        </p>
        <Link className="text-link mt-3 inline-block" to="/ctu-sync">
          Connect CTU
        </Link>
      </section>
    );
  const connection = data.connection;
  const observed =
    connection.observedIds === undefined ? null : new Set(connection.observedIds.split(','));
  const items = data.items.filter(
    (i) => i.portalName === connection.portalName && i.course === connection.course,
  );
  const deadlines = items
    .filter(
      (i) =>
        i.kind === 'assessment' &&
        (!unplannedOnly || !data.links?.some((link) => link.id === i.id)),
    )
    .sort(
      (a, b) =>
        (a.dueDate + a.dueTime).localeCompare(b.dueDate + b.dueTime) ||
        a.title.localeCompare(b.title),
    );
  const today = sastDay(new Date(now));
  const tasks = new Map(planner?.data.assessments.map((task) => [task.id, task]) ?? []);
  const open = deadlines.filter((item) => {
    const task = tasks.get(`ctu-${item.id}`);
    return !task || (!task.archived && task.status !== 'Completed');
  });
  const needsEstimate = deadlines.filter(
    (item) => !data.links?.some((link) => link.id === item.id),
  ).length;
  if (unplannedOnly && !needsEstimate) return null;
  return (
    <section className="mt-7 border-t border-line pt-6">
      <div className="section-heading">
        <h2>
          {unplannedOnly ? 'Ready to plan' : 'CTU deadlines'} ({deadlines.length})
        </h2>
        {compact && (
          <Link className="text-link" to="/ctu-sync">
            View CTU information
          </Link>
        )}
      </div>
      <p className="help mt-2">Saved from CTU to your private StudyFlow account.</p>
      <p className="mt-3 rounded-lg bg-accent-soft px-4 py-3 text-sm font-semibold text-ink">
        {open.filter((item) => item.dueDate >= today && item.dueDate <= addDays(today, 6)).length}{' '}
        known deadlines in the next 7 days · {open.filter((item) => item.dueDate < today).length}{' '}
        past due dates · {needsEstimate} awaiting planning details
      </p>
      <details className="help mt-3">
        <summary className="cursor-pointer text-link">About these dates and planning</summary>
        <p className="mt-2">
          Portal dates retain their supplied precision; timezone is unconfirmed. Add the time needed
          for your work to include these items in your study plan.
        </p>
      </details>
      {now - connection.capturedAt.toMillis() >= 7 * 86400000 && (
        <p className="notice mt-3">
          Your CTU information is at least a week old.{' '}
          <Link className="text-link" to="/ctu-sync">
            Sync again
          </Link>{' '}
          to check for changes. Your saved work stays available.
        </p>
      )}
      <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-white px-4 sm:px-5">
        {(compact ? deadlines.slice(0, 5) : deadlines).map((item) => (
          <li
            key={item.id}
            className="relative py-4 pl-4 before:absolute before:top-5 before:bottom-5 before:left-0 before:w-1 before:rounded-full before:bg-accent"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-semibold text-ink">{item.title}</p>
              <p
                className={`text-sm font-semibold ${item.dueDate < today ? 'text-danger' : 'text-accent'}`}
              >
                Due{' '}
                {item.dueDate === today
                  ? 'today · '
                  : item.dueDate === addDays(today, 1)
                    ? 'tomorrow · '
                    : ''}
                {item.dueDate}
                {item.dueTime ? ` · ${item.dueTime}` : ' · Time not supplied'}
              </p>
            </div>
            {isCtuAssignment(item.title) && <p className="help">Assignment · FA</p>}
            {item.upload === 'seen' &&
              (isCtuAssignment(item.title) ||
                tasks.get(`ctu-${item.id}`)?.type === 'Assignment') && (
                <div className="mt-2">
                  <SuccessCheck>Uploaded to CTU</SuccessCheck>
                </div>
              )}
            <p className="mt-1 text-sm text-muted">{item.module}</p>
            {tasks.get(`ctu-${item.id}`) && (
              <p className="help mt-1">
                Your plan: {tasks.get(`ctu-${item.id}`)!.status} ·{' '}
                {tasks.get(`ctu-${item.id}`)!.remainingMinutes}{' '}
                {tasks.get(`ctu-${item.id}`)!.type === 'Assignment' ? 'work' : 'study'} minutes
                remaining
                {tasks.get(`ctu-${item.id}`)!.archived ? ' · Archived' : ''}
              </p>
            )}
            {observed && !observed.has(item.id) && (
              <p className="help mt-1">
                Not seen in the latest sync. Retained because CTU lists can be incomplete.
              </p>
            )}
            {item.previousDue && (
              <p className="mt-1 text-sm text-warning">
                Deadline changed from {item.previousDue.replace('T', ' ')}.
              </p>
            )}
            {!compact && (
              <p className="help mt-1">
                {item.upload === 'seen'
                  ? 'Upload observed on CTU; completion is your decision.'
                  : item.upload === 'not-seen'
                    ? 'No upload observed on the collected Uploads page.'
                    : 'Submission information unavailable.'}
              </p>
            )}
            {data.links?.some((link) => link.id === item.id) ? (
              <div className="mt-3">
                <Link className="text-link" to="/assessments">
                  Open in assessments
                </Link>
                {' · '}
                <Link className="text-link" to="/planner">
                  {isCtuAssignment(item.title) ? 'Plan assignment work' : 'Plan study time'}
                </Link>
                {data.links.find((link) => link.id === item.id)?.conflict && (
                  <p className="mt-2 text-warning">
                    CTU changed a title or deadline you edited. Your version was kept; compare the
                    source above with your assessment.
                  </p>
                )}
              </div>
            ) : compact ? (
              <Link className="text-link mt-3 inline-block" to="/ctu-sync">
                {isCtuAssignment(item.title) ? 'Plan assignment' : 'Add study estimate'}
              </Link>
            ) : (
              planner?.available && (
                <CtuPlanAction
                  key={`${uid}-${item.id}`}
                  uid={uid}
                  item={item}
                  subjects={planner.data.subjects}
                />
              )
            )}
            <CtuCompleteAction
              key={`complete-${uid}-${item.id}`}
              uid={uid}
              item={item}
              task={tasks.get(`ctu-${item.id}`)}
            />
          </li>
        ))}
      </ul>
      {!deadlines.length && (
        <p className="mt-3">
          No deadlines have been collected for this course. Portal coverage may be incomplete.
        </p>
      )}
      {compact && deadlines.length > 5 && (
        <p className="help">Showing the first 5 of {deadlines.length} known deadlines.</p>
      )}
      {!compact && (
        <>
          <h2 className="mt-7">
            Saved modules ({items.filter((i) => i.kind === 'module').length})
          </h2>
          <p className="help mt-2">{connection.course}</p>
          <ul className="mt-3 divide-y divide-line">
            {items
              .filter((i) => i.kind === 'module')
              .map((i) => (
                <li key={i.id} className="py-3">
                  {i.title}
                </li>
              ))}
          </ul>
          <h2 className="mt-7">Schedules and resources</h2>
          <ul className="mt-3 space-y-3">
            {items
              .filter((i) => i.kind === 'document' || i.kind === 'resource')
              .map((i) => (
                <li key={i.id}>
                  {i.url ? (
                    <a className="text-link" href={i.url} target="_blank" rel="noopener noreferrer">
                      {i.title}
                    </a>
                  ) : (
                    <span>
                      {i.title} <span className="help">— resource title from CTU</span>
                    </span>
                  )}
                </li>
              ))}
          </ul>
          <p className="help mt-3">
            Timetable documents are links; class times have not been imported.
          </p>
          <details className="mt-5">
            <summary className="cursor-pointer font-semibold">Collection coverage</summary>
            <p className="help mt-3">{connection.coverage}</p>
            <p className="help mt-2">{connection.warnings}</p>
            <p className="help mt-2">
              Previously saved records are retained when absent from a later collection. This is not
              a complete enrolment or submission record.
            </p>
          </details>
        </>
      )}
    </section>
  );
}
