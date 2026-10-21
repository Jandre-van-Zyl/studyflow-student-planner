import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/authContext';
import {
  APP_ORIGIN,
  CTU_CHANNEL,
  parsePortalSnapshot,
  type PortalSnapshot,
} from './portalContract';

interface PreviewState {
  uid: string;
  snapshot: PortalSnapshot | null;
  error: string;
  busy: boolean;
  helper: boolean;
}
export function CtuSyncPage() {
  const { status, mode, user } = useAuth();
  const uid = status === 'ready' && mode === 'cloud' ? (user?.uid ?? '') : '';
  const [state, setState] = useState<PreviewState>({
    uid: '',
    snapshot: null,
    error: '',
    busy: false,
    helper: false,
  });
  const [confirmed, setConfirmed] = useState(false);
  const pending = useRef<string | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active =
    state.uid === uid ? state : { uid, snapshot: null, error: '', busy: false, helper: false };
  useEffect(() => {
    if (!uid) return;
    const probe = crypto.randomUUID();
    function receive(event: MessageEvent<unknown>) {
      if (
        event.source !== window ||
        event.origin !== APP_ORIGIN ||
        !event.data ||
        typeof event.data !== 'object'
      )
        return;
      const message = event.data as Record<string, unknown>;
      if (message.channel !== CTU_CHANNEL) return;
      if (message.type === 'ready' && message.requestId === probe && message.version === 1) {
        setState((prior) => ({
          ...(prior.uid === uid ? prior : { uid, snapshot: null, error: '', busy: false }),
          helper: true,
        }));
        return;
      }
      if (
        !pending.current ||
        message.requestId !== pending.current ||
        !['result', 'error'].includes(String(message.type))
      )
        return;
      pending.current = null;
      if (timeout.current) clearTimeout(timeout.current);
      try {
        if (message.type === 'error')
          throw new Error(
            typeof message.error === 'string' && message.error.length < 300
              ? message.error
              : 'CTU collection failed.',
          );
        const snapshot = parsePortalSnapshot(message.snapshot);
        setState({ uid, helper: true, busy: false, error: '', snapshot });
      } catch (error) {
        setState({
          uid,
          helper: true,
          busy: false,
          snapshot: null,
          error: error instanceof Error ? error.message : 'Invalid CTU preview.',
        });
      }
    }
    window.addEventListener('message', receive);
    window.postMessage({ channel: CTU_CHANNEL, type: 'probe', requestId: probe }, APP_ORIGIN);
    return () => {
      window.removeEventListener('message', receive);
      if (pending.current)
        window.postMessage(
          { channel: CTU_CHANNEL, type: 'cancel', requestId: pending.current },
          APP_ORIGIN,
        );
      pending.current = null;
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [uid]);
  if (!uid)
    return (
      <section>
        <h1>Connect CTU</h1>
        <p className="notice mt-5">
          Sign into your approved StudyFlow cloud account to try the private CTU preview. Layout and
          emulator modes cannot connect.
        </p>
      </section>
    );
  function cancel() {
    if (pending.current)
      window.postMessage(
        { channel: CTU_CHANNEL, type: 'cancel', requestId: pending.current },
        APP_ORIGIN,
      );
    pending.current = null;
    if (timeout.current) clearTimeout(timeout.current);
    setState((prior) => ({
      ...prior,
      busy: false,
      snapshot: null,
      error: 'Collection cancelled. No planner records were changed.',
    }));
  }
  function collect() {
    if (!active.helper || pending.current) return;
    const requestId = crypto.randomUUID();
    pending.current = requestId;
    setConfirmed(false);
    setState({ uid, helper: true, busy: true, snapshot: null, error: '' });
    window.postMessage({ channel: CTU_CHANNEL, type: 'collect', requestId }, APP_ORIGIN);
    timeout.current = setTimeout(() => {
      if (pending.current !== requestId) return;
      window.postMessage({ channel: CTU_CHANNEL, type: 'cancel', requestId }, APP_ORIGIN);
      pending.current = null;
      setState({
        uid,
        helper: true,
        busy: false,
        snapshot: null,
        error: 'The connection timed out. Finish CTU sign-in, then try again.',
      });
    }, 180_000);
  }
  const snapshot = active.snapshot;
  return (
    <section>
      <h1>Connect CTU</h1>
      <p className="mt-3 max-w-[65ch] leading-7">
        Read your modules and deadlines from CampusOnline. This local prototype keeps the result on
        this screen; it does not save or change your planner.
      </p>
      <p className="mt-4 break-words text-sm text-muted">StudyFlow account: {user?.email}</p>
      <div className="mt-6 border-y border-line py-5">
        <p role="status" className="text-sm">
          {active.helper
            ? 'Browser helper connected.'
            : 'Load the local StudyFlow CTU Preview extension in this browser, then reload this page.'}
        </p>
        <p className="mt-3 text-sm leading-6">
          Connecting opens a separate CTU tab. Sign in there if asked. The helper reads five
          supported pages, then closes its own tab. Your existing portal tab stays open.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="btn btn-primary"
            onClick={collect}
            disabled={!active.helper || active.busy}
          >
            Connect and preview
          </button>
          {active.busy && (
            <button className="btn btn-secondary" onClick={cancel}>
              Cancel collection
            </button>
          )}
          {snapshot && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setState((prior) => ({ ...prior, snapshot: null }));
                setConfirmed(false);
              }}
            >
              Clear preview
            </button>
          )}
        </div>
        {active.busy && (
          <p role="status" className="mt-4">
            Waiting for CTU and collecting supported pages. Allow up to three minutes; enter any
            password only on the genuine CTU page.
          </p>
        )}
        {active.error && (
          <p role="alert" className="mt-4 text-danger">
            {active.error}
          </p>
        )}
      </div>
      {snapshot && (
        <div className="mt-7 space-y-7">
          <div>
            <h2>Account check</h2>
            <p className="mt-3">
              CTU portal name: <strong>{snapshot.portalName || 'Not available'}</strong>
            </p>
            <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 min-h-5 w-5 shrink-0 appearance-auto rounded-none border-0 p-0 accent-accent"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <span className="flex-1">
                This is my CTU portal account, and I am reviewing its data under {user?.email}.
              </span>
            </label>
            <p className="mt-2 text-sm text-muted">
              The displayed name is not verified email matching. Nothing is linked or saved by
              confirming this preview.
            </p>
          </div>
          <div>
            <h2>Assessment preview ({snapshot.assessments.length})</h2>
            <p className="mt-2 text-sm text-muted">
              {confirmed
                ? 'Account acknowledged for this preview session.'
                : 'Check the portal account above before using these dates.'}{' '}
              Times below are portal wall times; timezone has not been confirmed.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="p-3">Module / assessment</th>
                    <th className="p-3">Portal deadline</th>
                    <th className="p-3">Submission indicator</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.assessments.map((item) => (
                    <tr
                      key={JSON.stringify([item.module, item.title])}
                      className="border-b border-line"
                    >
                      <td className="p-3">
                        <span className="block font-semibold">{item.title}</span>
                        <span className="mt-1 block text-muted">{item.module}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {item.due.replace('T', ' ')}
                        {item.due.length === 10 && (
                          <span className="block text-xs text-muted">Date only; time unknown</span>
                        )}
                      </td>
                      <td className="p-3">
                        {item.submitted
                          ? 'File uploaded on CTU; completion not inferred'
                          : 'No upload observed on collected pages'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!snapshot.assessments.length && (
              <p className="notice mt-3">
                No assessments found on the collected pages. This does not prove there are no
                deadlines.
              </p>
            )}
          </div>
          <div>
            <h2>Modules ({snapshot.modules.length})</h2>
            <p className="mt-2 text-sm text-muted">{snapshot.course || 'Course not available'}</p>
            <ul className="mt-3 divide-y divide-line">
              {snapshot.modules.map((item) => (
                <li className="py-3 text-sm" key={item.name}>
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Schedules and notices</h2>
            <p className="mt-2 text-sm text-muted">
              Document links only. Timetable PDFs have not been converted into classes.
            </p>
            <ul className="mt-3 space-y-3">
              {snapshot.documents.map((doc) => (
                <li key={doc.url}>
                  <a className="text-link" target="_blank" rel="noopener noreferrer" href={doc.url}>
                    {doc.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <details className="border-t border-line pt-4">
            <summary className="cursor-pointer font-semibold">
              Resource titles ({snapshot.resources.length})
            </summary>
            <ul className="mt-3 space-y-2 text-sm">
              {snapshot.resources.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
          </details>
          <div className="border-t border-line pt-5">
            <h2>Coverage and limitations</h2>
            <p className="mt-2 text-sm">
              Preview collected{' '}
              {new Date(snapshot.capturedAt).toLocaleString('en-ZA', {
                timeZone: 'Africa/Johannesburg',
              })}{' '}
              SAST.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {[...snapshot.coverage, ...snapshot.warnings].map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
