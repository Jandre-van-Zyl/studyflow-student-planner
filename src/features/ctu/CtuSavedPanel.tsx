import { Link, useSearchParams } from 'react-router';
import { useContext, useId, useState } from 'react';
import { PreviewContext } from '@/features/planner/previewContext';
import { addDays, displayDay, sastDay } from '@/features/planner/planningView';
import { useCurrentTime } from '@/shared/hooks/useCurrentTime';
import { SuccessCheck } from '@/shared/components/SuccessCheck';
import { CtuPlanAction } from './CtuPlanAction';
import { CtuCompleteAction } from './CtuCompleteAction';
import { useCtuImports } from './useCtuImports';
import { isCtuAssignment } from './ctuAssessmentKind';
import type { CtuItem } from './ctuImportContract';

type DeadlineFilter = 'active' | 'planned' | 'uploaded' | 'finished' | 'all';

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
  const [params, setParams] = useSearchParams();
  const [compactFilter, setCompactFilter] = useState<DeadlineFilter>('active');
  const requestedFilter = params.get('status');
  const filter: DeadlineFilter = compact
    ? compactFilter
    : requestedFilter && ['planned', 'uploaded', 'finished', 'all'].includes(requestedFilter)
      ? (requestedFilter as DeadlineFilter)
      : 'active';
  function setFilter(value: DeadlineFilter) {
    if (compact) setCompactFilter(value);
    else
      setParams(
        (current) => {
          current.set('status', value);
          return current;
        },
        { replace: true },
      );
  }
  const [query, setQuery] = useState('');
  const [module, setModule] = useState('');
  const sectionId = useId();
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
        <p className="mt-2">Bring your modules and deadlines into your planner with one sync.</p>
        <Link className="text-link mt-3 inline-block" to="/ctu-sync">
          Connect CTU
        </Link>
      </section>
    );
  const connection = data.connection;
  const observed =
    connection.observedIds === undefined ? null : new Set(connection.observedIds.split(','));
  const items = data.items.filter(
    (item) => item.portalName === connection.portalName && item.course === connection.course,
  );
  const links = new Map(data.links?.map((link) => [link.id, link]) ?? []);
  const tasks = new Map(planner?.data.assessments.map((task) => [task.id, task]) ?? []);
  const today = sastDay(new Date(now));
  const deadlines = items
    .filter((item) => item.kind === 'assessment' && (!unplannedOnly || !links.has(item.id)))
    .sort((a, b) => {
      // Upcoming work comes first; old incomplete records remain available below it.
      const oldA = a.dueDate < today ? 1 : 0;
      const oldB = b.dueDate < today ? 1 : 0;
      return (
        oldA - oldB ||
        (a.dueDate + a.dueTime).localeCompare(b.dueDate + b.dueTime) ||
        a.title.localeCompare(b.title)
      );
    });
  const finished = (item: CtuItem) => {
    const task = tasks.get(`ctu-${item.id}`);
    return task?.archived || task?.status === 'Completed';
  };
  const missing = (item: CtuItem) => observed !== null && !observed.has(item.id);
  const actionable = (item: CtuItem) => !finished(item) && !missing(item) && item.upload !== 'seen';
  const activeItems = deadlines.filter(actionable);
  const matches = (item: CtuItem, view: DeadlineFilter) => {
    if (view === 'active') return actionable(item);
    if (view === 'planned') return actionable(item) && links.has(item.id);
    if (view === 'uploaded') return item.upload === 'seen' && !finished(item);
    if (view === 'finished') return finished(item);
    return true;
  };
  const filtered = deadlines.filter(
    (item) =>
      matches(item, filter) &&
      (!module || item.module === module) &&
      `${item.title} ${item.module}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const showFilters = !compact || unplannedOnly;
  const visible = compact ? (showFilters ? filtered : activeItems).slice(0, 5) : filtered;
  const uploadedCount = deadlines.filter((item) => matches(item, 'uploaded')).length;
  const needsPlanning = activeItems.filter((item) => !links.has(item.id)).length;
  const modules = items.filter((item) => item.kind === 'module');
  const resources = items.filter((item) => item.kind === 'document' || item.kind === 'resource');
  if (unplannedOnly && deadlines.length === 0) return null;
  const filters: { value: DeadlineFilter; label: string }[] = [
    { value: 'active', label: 'Active' },
    ...(!unplannedOnly ? [{ value: 'planned' as const, label: 'In planner' }] : []),
    { value: 'uploaded', label: 'Uploaded' },
    ...(!unplannedOnly ? [{ value: 'finished' as const, label: 'Finished' }] : []),
    { value: 'all', label: 'All' },
  ];
  return (
    <section className="mt-7 border-t border-line pt-6" aria-labelledby={`${sectionId}-title`}>
      <div className="section-heading">
        <div>
          <h2 id={`${sectionId}-title`}>
            {unplannedOnly ? 'From CTU, ready to plan' : 'CTU deadlines'}
          </h2>
          <p className="help mt-1">{connection.course || 'Your saved CTU course'}</p>
        </div>
        {compact && (
          <Link className="text-link" to="/ctu-sync">
            View all CTU information
          </Link>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-line py-4">
        {[
          [
            'Next 7 days',
            activeItems.filter((item) => item.dueDate >= today && item.dueDate <= addDays(today, 6))
              .length,
          ],
          ['To plan', needsPlanning],
          ['Uploaded', uploadedCount],
        ].map(([label, count]) => (
          <div key={label}>
            <dt className="help">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">{count}</dd>
          </div>
        ))}
      </dl>
      {showFilters && (
        <>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="CTU deadline status">
            {filters.map(({ value, label }) => (
              <button
                key={value}
                className={`btn ${filter === value ? 'btn-primary' : 'btn-quiet'}`}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label} ({deadlines.filter((item) => matches(item, value)).length})
              </button>
            ))}
          </div>
          {!compact && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="field-label">
                Search CTU deadlines
                <input
                  className="input mt-1"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Assessment or module"
                />
              </label>
              <label className="field-label">
                Module
                <select
                  className="input mt-1"
                  value={module}
                  onChange={(event) => setModule(event.target.value)}
                >
                  <option value="">All modules</option>
                  {[...new Set(deadlines.map((item) => item.module))].sort().map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </>
      )}
      {uploadedCount > 0 && !showFilters && (
        <p className="help mt-3">
          {uploadedCount} uploaded {uploadedCount === 1 ? 'item' : 'items'} to review.{' '}
          <Link className="text-link" to="/ctu-sync?status=uploaded">
            Review uploaded work
          </Link>
        </p>
      )}
      <ul className="mt-4 divide-y divide-line">
        {visible.map((item) => {
          const task = tasks.get(`ctu-${item.id}`);
          const link = links.get(item.id);
          const assignment = task ? task.type === 'Assignment' : isCtuAssignment(item.title);
          return (
            <li key={item.id} className="py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">{item.module}</p>
                  <p className="help mt-1">
                    {assignment
                      ? isCtuAssignment(item.title)
                        ? 'Assignment · FA'
                        : 'Assignment'
                      : task?.type || 'Assessment'}
                    {link ? ' · In your planner' : ''}
                  </p>
                </div>
                <div className="shrink-0 border-l-2 border-accent pl-3 sm:min-w-36">
                  <p
                    className={`font-semibold ${item.dueDate < today && actionable(item) ? 'text-danger' : 'text-ink'}`}
                  >
                    Due{' '}
                    {item.dueDate === today
                      ? 'today'
                      : item.dueDate === addDays(today, 1)
                        ? 'tomorrow'
                        : displayDay(item.dueDate)}
                  </p>
                  <p className="help mt-1">
                    {item.dueDate}
                    {item.dueTime ? ` · ${item.dueTime}` : ' · Time not supplied'}
                  </p>
                </div>
              </div>
              {item.upload === 'seen' && (
                <div className="mt-3">
                  <SuccessCheck>Uploaded to CTU</SuccessCheck>
                </div>
              )}
              {task && !finished(item) && (
                <p className="help mt-2">
                  {task.status} · {task.remainingMinutes} {assignment ? 'work' : 'study'} minutes
                  remaining
                </p>
              )}
              {task?.archived && <p className="help mt-2">Archived in your planner</p>}
              {task?.status === 'Completed' && task.type !== 'Assignment' && (
                <div className="mt-3">
                  <SuccessCheck>Completed by you</SuccessCheck>
                </div>
              )}
              {missing(item) && (
                <p className="help mt-2">Not seen in the latest sync; kept for reference.</p>
              )}
              {item.previousDue && (
                <p className="mt-2 text-sm text-warning">
                  Deadline changed from {item.previousDue.replace('T', ' ')}.
                </p>
              )}
              {link ? (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  <Link className="text-link" to={`/assessments?assessment=ctu-${item.id}`}>
                    Open in assessments
                  </Link>
                  {!finished(item) && (
                    <Link className="text-link" to={`/planner?assessment=ctu-${item.id}`}>
                      {assignment ? 'Plan assignment work' : 'Plan study time'}
                    </Link>
                  )}
                </div>
              ) : (
                !missing(item) &&
                !finished(item) &&
                (showFilters && planner?.available ? (
                  <CtuPlanAction
                    key={`${uid}-${item.id}`}
                    uid={uid}
                    item={item}
                    subjects={planner.data.subjects}
                  />
                ) : (
                  <Link className="text-link mt-3 inline-block" to="/ctu-sync">
                    {assignment ? 'Plan assignment' : 'Add study estimate'}
                  </Link>
                ))
              )}
              {link?.conflict && (
                <p className="notice mt-3">
                  CTU changed a title or deadline you edited. Your version was kept; compare the
                  source above with your assessment.
                </p>
              )}
              <CtuCompleteAction
                key={`complete-${uid}-${item.id}`}
                uid={uid}
                item={item}
                task={task}
              />
              {!compact && (
                <p className="help mt-2">
                  {item.upload === 'seen'
                    ? 'Upload observed on CTU; completion is your decision.'
                    : item.upload === 'not-seen'
                      ? 'No upload observed on the collected Uploads page.'
                      : 'Submission information unavailable.'}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {!visible.length && (
        <p role="status" className="mt-4 rounded-lg bg-accent-soft px-4 py-5 text-sm text-muted">
          {query || module
            ? 'No deadlines match these filters. Try another module or search.'
            : !deadlines.length
              ? 'No deadlines collected for this course yet. Sync again when CTU publishes them.'
              : 'No deadlines in this view. Choose another status to see your other CTU work.'}
        </p>
      )}
      {compact && (showFilters ? filtered : activeItems).length > 5 && (
        <p className="help mt-3">
          Showing 5 of {(showFilters ? filtered : activeItems).length} matching deadlines. View all
          CTU information for the full list.
        </p>
      )}
      {now - connection.capturedAt.toMillis() >= 7 * 86400000 && (
        <p className="help mt-4">
          Ready for a weekly check?{' '}
          <Link className="text-link" to="/ctu-sync">
            Sync CTU again
          </Link>{' '}
          to update deadlines. Your saved plans stay available.
        </p>
      )}
      <details className="help mt-4">
        <summary className="cursor-pointer text-link">How these dates and plans work</summary>
        <p className="mt-2">
          Portal dates retain their supplied precision; timezone is unconfirmed. Add the time needed
          for your work to include it in your study plan. An upload is separate from your decision
          to mark an assignment complete. Items absent from the latest sync stay under All because
          CTU lists can be incomplete.
        </p>
      </details>
      {!compact && (
        <>
          <details className="mt-7 border-t border-line pt-5">
            <summary className="cursor-pointer font-semibold text-ink">
              Saved modules ({modules.length})
            </summary>
            <p className="help mt-3">
              Use these names when adding subjects. Planning a CTU assessment can create its subject
              for you.
            </p>
            <ul className="mt-3 divide-y divide-line">
              {modules.map((item) => (
                <li key={item.id} className="py-3 text-sm">
                  {item.title}
                </li>
              ))}
            </ul>
            {!modules.length && (
              <p className="help mt-3">No module names were collected in this course.</p>
            )}
            <Link className="text-link mt-3 inline-block" to="/subjects">
              Manage subjects and class times
            </Link>
          </details>
          <details className="mt-5 border-t border-line pt-5">
            <summary className="cursor-pointer font-semibold text-ink">
              Schedules and resources ({resources.length})
            </summary>
            <ul className="mt-3 divide-y divide-line">
              {resources.map((item) => (
                <li key={item.id} className="py-3 text-sm">
                  {item.url ? (
                    <a
                      className="text-link"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.title} <span className="help">· PDF, opens in a new tab</span>
                    </a>
                  ) : (
                    <span>
                      {item.title} <span className="help">· Resource title from CTU</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {!resources.length && (
              <p className="help mt-3">No schedule links or resource titles were collected.</p>
            )}
            <p className="help mt-3">
              Open a timetable to check your class times, then add them under Subjects. PDF class
              times have not been imported automatically.
            </p>
            <Link className="text-link mt-3 inline-block" to="/grades">
              View grades or import an academic report
            </Link>
          </details>
          <details className="help mt-5 border-t border-line pt-5">
            <summary className="cursor-pointer text-link">Collection coverage</summary>
            <p className="mt-3">{connection.coverage}</p>
            {connection.warnings && <p className="mt-2">{connection.warnings}</p>}
            <p className="mt-2">
              Previously saved records are retained when absent from a later collection. This is not
              a complete enrolment or submission record.
            </p>
          </details>
        </>
      )}
    </section>
  );
}
