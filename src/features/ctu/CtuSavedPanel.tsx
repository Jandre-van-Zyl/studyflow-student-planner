import { Link } from 'react-router';
import { useCtuImports } from './useCtuImports';

export function CtuSavedPanel({ compact = false }: { compact?: boolean }) {
  const { enabled, data, loading, error, retry } = useCtuImports();
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
  const items = data.items.filter(
    (i) => i.portalName === connection.portalName && i.course === connection.course,
  );
  const deadlines = items
    .filter((i) => i.kind === 'assessment')
    .sort(
      (a, b) =>
        (a.dueDate + a.dueTime).localeCompare(b.dueDate + b.dueTime) ||
        a.title.localeCompare(b.title),
    );
  return (
    <section className="mt-7 border-t border-line pt-6">
      <div className="section-heading">
        <h2>Saved CTU deadlines ({deadlines.length})</h2>
        {compact && (
          <Link className="text-link" to="/ctu-sync">
            View CTU information
          </Link>
        )}
      </div>
      <p className="help mt-2">
        Saved to your StudyFlow account. Last collected{' '}
        {connection.capturedAt
          .toDate()
          .toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}{' '}
        SAST.
      </p>
      <p className="help mt-2">
        Portal dates retain their supplied precision; timezone is unconfirmed. These source
        deadlines do not yet include your planning estimates.
      </p>
      <ul className="mt-4 divide-y divide-line">
        {(compact ? deadlines.slice(0, 5) : deadlines).map((item) => (
          <li key={item.id} className="py-4">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted">{item.module}</p>
            <p className="mt-1 text-sm">
              Due {item.dueDate}
              {item.dueTime ? ` at ${item.dueTime}` : ' · Time not supplied'}
            </p>
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
