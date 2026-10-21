import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ViewBlock } from '@/features/planner/planningView';
import { useStudySessions } from './useStudySessions';
import { saveStudySession } from './studySessionService';

interface PipApi {
  requestWindow: (options: { width: number; height: number }) => Promise<Window>;
}

export function StudyTimer({ uid, blocks = [] }: { uid?: string; blocks?: ViewBlock[] }) {
  const sessions = useStudySessions(uid);
  const [blockId, setBlockId] = useState('');
  const [now, setNow] = useState(Date.now);
  const [dismissed, setDismissed] = useState('');
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState('');
  const [pendingSave, setPendingSave] = useState(false);
  const [checkpoint, setCheckpoint] = useState(25 * 60);
  const startedAt = useRef(0);
  const sessionId = useRef('');
  const savingLock = useRef(false);
  const notified = useRef(new Set<string>());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 15000);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', tick);
    };
  }, []);
  const due = blocks.find(
    (b) =>
      b.status === 'Planned' &&
      Date.parse(b.startAt) <= now + 5 * 60000 &&
      Date.parse(b.endAt) > now &&
      `${b.id}-${b.startAt}` !== dismissed,
  );
  useEffect(() => {
    if (!due || !('Notification' in window) || Notification.permission !== 'granted') return;
    const key = `${due.id}-${due.startAt}`;
    if (notified.current.has(key)) return;
    notified.current.add(key);
    if (document.hidden) {
      try {
        const notice = new Notification('StudyFlow: study time', {
          body: 'Your planned study block is starting. Open StudyFlow to start your timer.',
          tag: key,
        });
        notice.onclick = () => {
          window.focus();
          notice.close();
        };
      } catch {
        /* Inline reminder remains available. */
      }
    }
  }, [due]);
  const [expanded, setExpanded] = useState(false);
  const [minutes, setMinutes] = useState('25');
  const [remaining, setRemaining] = useState(25 * 60);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [popup, setPopup] = useState<Window | null>(null);
  const [error, setError] = useState('');
  const [kind, setKind] = useState('');
  const child = useRef<Window | null>(null);
  const active = useRef(true);
  const opening = useRef(false);
  const valid = /^\d+$/.test(minutes) && Number(minutes) >= 1 && Number(minutes) <= 180;
  const selectedBlock = blocks.find((b) => b.id === blockId);
  async function recordTime() {
    const seconds = checkpoint - remaining;
    if (!uid || !selectedBlock || seconds < 1 || savingLock.current || !sessions.ready) return;
    savingLock.current = true;
    setSaving(true);
    setError('');
    const ticket = sessionId.current || crypto.randomUUID();
    sessionId.current = ticket;
    setPendingSave(true);
    try {
      const prior = sessions.rows
        .filter((row) => row.blockId === blockId)
        .reduce((sum, row) => sum + row.seconds, 0);
      const target = (Date.parse(selectedBlock.endAt) - Date.parse(selectedBlock.startAt)) / 1000;
      await saveStudySession(
        uid,
        ticket,
        blockId,
        seconds,
        startedAt.current,
        prior + seconds >= target,
      );
      if (active.current) {
        setCheckpoint(remaining);
        startedAt.current = 0;
        sessionId.current = '';
        setPendingSave(false);
        setRecorded(`Saved ${Math.floor(seconds / 60)} min ${seconds % 60} sec to your planner.`);
      }
    } catch (failure) {
      if (active.current)
        setError(
          failure instanceof Error
            ? failure.message
            : 'Could not save study time. Keep this timer open and retry.',
        );
    } finally {
      savingLock.current = false;
      if (active.current) setSaving(false);
    }
  }
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      child.current?.close();
    };
  }, []);
  useEffect(() => {
    if (deadline === null) return;
    // Timestamp-based countdown stays correct when browsers throttle background timers.
    const clock = popup ?? window;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (!seconds) setDeadline(null);
    };
    const interval = clock.setInterval(tick, 500);
    return () => clock.clearInterval(interval);
  }, [deadline, popup]);
  useEffect(() => {
    if (!popup) return;
    const close = () => {
      child.current = null;
      if (active.current) setPopup(null);
    };
    popup.addEventListener('pagehide', close);
    return () => popup.removeEventListener('pagehide', close);
  }, [popup]);
  async function popOut() {
    if (opening.current) return;
    if (child.current && !child.current.closed) {
      child.current.focus();
      return;
    }
    opening.current = true;
    setError('');
    try {
      const pip = (window as Window & { documentPictureInPicture?: PipApi })
        .documentPictureInPicture;
      const target = pip
        ? await pip.requestWindow({ width: 360, height: 400 })
        : window.open('about:blank', '_blank', 'popup,width=360,height=440');
      if (!target) throw new Error('Allow pop-ups for StudyFlow, then try again.');
      if (!pip) target.opener = null;
      if (!active.current) {
        target.close();
        return;
      }
      target.document.title = 'Study timer · StudyFlow';
      document
        .querySelectorAll('link[rel="stylesheet"], style')
        .forEach((node) => target.document.head.appendChild(node.cloneNode(true)));
      target.document.body.style.margin = '0';
      target.document.body.style.padding = '20px';
      child.current = target;
      setKind(pip ? 'Always-on-top timer' : 'Separate timer window');
      setPopup(target);
      setExpanded(true);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'The timer window could not open. Use the timer here.',
      );
    } finally {
      opening.current = false;
    }
  }
  function reset() {
    if (!valid) return;
    setDeadline(null);
    setRemaining(Number(minutes) * 60);
    setCheckpoint(Number(minutes) * 60);
    startedAt.current = 0;
    sessionId.current = '';
    setRecorded('');
  }
  const display = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const controls = (
    <section
      aria-label="Study timer"
      className="rounded-xl border border-line bg-paper p-5 text-ink shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h2>Study timer</h2>
        {!popup && (
          <button className="text-link text-sm" onClick={() => setExpanded(false)}>
            Minimise
          </button>
        )}
      </div>
      <p className="help mt-3">
        {new Date(now).toLocaleString('en-ZA', {
          timeZone: 'Africa/Johannesburg',
          dateStyle: 'medium',
          timeStyle: 'short',
        })}{' '}
        SAST
      </p>
      {!!uid && (
        <label className="mt-3 block">
          Study block
          <select
            value={blockId}
            disabled={deadline !== null || checkpoint !== remaining || saving}
            onChange={(event) => {
              const block = blocks.find((b) => b.id === event.target.value);
              setBlockId(event.target.value);
              setRecorded('');
              if (block) {
                const length = Math.min(
                  180,
                  Math.max(
                    1,
                    Math.round((Date.parse(block.endAt) - Date.parse(block.startAt)) / 60000),
                  ),
                );
                setMinutes(String(length));
                setRemaining(length * 60);
                setCheckpoint(length * 60);
              }
            }}
          >
            <option value="">Free timer (not recorded)</option>
            {blocks
              .filter((b) => b.status === 'Planned' || b.id === blockId)
              .map((b) => (
                <option value={b.id} key={b.id}>
                  {b.title} · {b.startAt.slice(0, 16).replace('T', ' ')}
                </option>
              ))}
          </select>
        </label>
      )}
      <p
        className="mt-5 text-center text-5xl font-semibold tabular-nums"
        role="timer"
        aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`}
      >
        {display}
      </p>
      {!remaining && (
        <p role="status" className="mt-3 text-center font-semibold">
          Session finished. Time for a break.
        </p>
      )}
      <label className="mt-5 block">
        Session length (minutes)
        <input
          type="number"
          min="1"
          max="180"
          step="1"
          value={minutes}
          disabled={deadline !== null || !!blockId}
          onChange={(event) => {
            setMinutes(event.target.value);
            const n = Number(event.target.value);
            if (/^\d+$/.test(event.target.value) && n >= 1 && n <= 180) setRemaining(n * 60);
            setCheckpoint(n * 60);
          }}
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="btn btn-primary"
          disabled={!valid || !remaining || saving || pendingSave || (!!blockId && !sessions.ready)}
          onClick={() => {
            if (deadline !== null) {
              setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
              setDeadline(null);
            } else {
              if (!startedAt.current) startedAt.current = Date.now();
              setDeadline(Date.now() + remaining * 1000);
            }
          }}
        >
          {deadline !== null ? 'Pause' : 'Start'}
        </button>
        <button
          className="btn btn-secondary"
          disabled={!valid || saving || (!!blockId && checkpoint !== remaining)}
          onClick={reset}
        >
          Reset
        </button>
        {!popup && (
          <button className="btn btn-secondary" onClick={() => void popOut()}>
            Pop out
          </button>
        )}
        {popup && (
          <button className="btn btn-secondary" onClick={() => popup.close()}>
            Return to app
          </button>
        )}
      </div>
      {!!blockId && (
        <button
          className="btn btn-primary mt-3"
          disabled={deadline !== null || checkpoint === remaining || saving || !sessions.ready}
          onClick={() => void recordTime()}
        >
          {saving ? 'Saving study time…' : 'Save studied time'}
        </button>
      )}
      {recorded && (
        <p role="status" className="mt-3 text-sm">
          {recorded}
        </p>
      )}
      {!!uid && !sessions.ready && (
        <p className="help mt-3">
          {sessions.error
            ? 'Study-time saving is unavailable. Reload after the private session rules are enabled. Free timer still works.'
            : 'Loading recorded study time…'}
        </p>
      )}
      {'Notification' in window && Notification.permission === 'default' && (
        <button
          className="text-link mt-3 text-sm"
          onClick={() => {
            void Notification.requestPermission().catch(() => {});
          }}
        >
          Enable desktop study reminders
        </button>
      )}
      <p className="help mt-4">
        {popup ? kind + '. ' : ''}Select a study block to record time. Pause or finish, then save.
        Free timer records nothing. Keep StudyFlow open; reload discards unsaved time.
      </p>
      {popup && kind === 'Separate timer window' && (
        <p className="help mt-2">
          Your browser does not support always-on-top mode. Place this window beside your other
          work.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
  return (
    <>
      <div className="fixed right-4 bottom-4 z-30 max-w-[calc(100vw-2rem)]">
        {due && !blockId && (
          <div
            role="status"
            className="mb-3 max-w-[340px] rounded-lg border border-accent bg-white p-4"
          >
            <p className="font-semibold text-ink">Time to study: {due.title}</p>
            <p className="help">{due.startAt.slice(11, 16)} SAST · Start when you are ready.</p>
            <button
              className="btn btn-primary mt-2"
              onClick={() => {
                const length = Math.round(
                  (Date.parse(due.endAt) - Date.parse(due.startAt)) / 60000,
                );
                setBlockId(due.id);
                setMinutes(String(length));
                setRemaining(length * 60);
                setCheckpoint(length * 60);
                setExpanded(true);
              }}
            >
              Open study timer
            </button>
            <button
              className="text-link ml-3"
              onClick={() => setDismissed(`${due.id}-${due.startAt}`)}
            >
              Dismiss
            </button>
          </div>
        )}
        {expanded && !popup ? (
          controls
        ) : (
          <button
            className="btn btn-primary shadow-sm"
            onClick={() => {
              setExpanded(true);
              if (popup) popup.focus();
            }}
          >
            Study timer · {display}
          </button>
        )}
      </div>
      {popup && createPortal(controls, popup.document.body)}
    </>
  );
}
