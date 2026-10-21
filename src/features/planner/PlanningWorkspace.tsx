import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useAuth } from '@/features/auth/authContext';
import { Modal } from '@/shared/components/Modal';
import { PreviewContext } from './previewContext';
import { EMPTY_VIEW, ZERO_BUDGETS, exampleView, sastDay } from './planningView';
import { savePlannerRecord, watchPlanner } from './plannerService';
import { PlannerError, toPlannerInput, type PlannerViewRecord } from './plannerContract';
import type { PlannerKind } from '@/shared/types/planner';
import { StudyTimer } from '@/features/timer/StudyTimer';

export function PlanningWorkspace() {
  const { user, status } = useAuth();
  return (
    <Workspace
      key={status === 'ready' ? user?.uid : status}
      uid={status === 'ready' ? user?.uid : undefined}
    />
  );
}
function Workspace({ uid }: { uid?: string }) {
  const { profile, status } = useAuth();
  const preview = status === 'disabled';
  const location = useLocation();
  const [data, setData] = useState(EMPTY_VIEW);
  const [loading, setLoading] = useState(!!uid);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const active = useRef(false);
  const generation = useRef(0);
  const [day, setDay] = useState(sastDay);
  const [example, setExample] = useState(false);
  const [clearing, setClearing] = useState(false);
  const hasData = data.subjects.length > 0 || data.assessments.length > 0 || data.blocks.length > 0;
  const plannerRoute = ['/dashboard', '/subjects', '/assessments', '/planner'].includes(
    location.pathname,
  );
  useEffect(() => {
    generation.current++;
    active.current = true;
    if (!uid)
      return () => {
        active.current = false;
      };
    let alive = true;
    let stop = () => {};
    const failed = () => {
      if (!alive) return;
      alive = false;
      clearTimeout(timer);
      stop();
      active.current = false;
      generation.current++;
      setLoading(false);
      setError(
        'Your planner could not be loaded. Check your connection and retry. Your saved records have not been cleared.',
      );
    };
    const timer = setTimeout(failed, 15000);
    try {
      stop = watchPlanner(
        uid,
        (value) => {
          if (!alive) return;
          clearTimeout(timer);
          setData(value);
          setLoaded(true);
          setLoading(false);
          setError('');
        },
        failed,
      );
    } catch {
      failed();
    }
    return () => {
      alive = false;
      active.current = false;
      clearTimeout(timer);
      stop();
    };
  }, [uid, retry]);
  async function saveRecord<K extends PlannerKind>(kind: K, item: PlannerViewRecord<K>) {
    const ticket = generation.current;
    if (!active.current || (!preview && (!uid || loading || error)))
      throw new PlannerError('session', 'Reload your planner before saving.');
    toPlannerInput(kind, item);
    if (preview) {
      setData((value) => ({
        ...value,
        [kind]: [...value[kind].filter((record) => record.id !== item.id), item],
      }));
    } else {
      await savePlannerRecord(uid!, kind, item);
      if (!active.current || ticket !== generation.current)
        throw new PlannerError('session', 'The session changed before save confirmation.');
    }
  }
  return (
    <PreviewContext.Provider
      value={{
        data,
        saveRecord,
        preview,
        available: preview || (!!uid && !loading && !error),
        day,
        setDay,
        budgets:
          profile?.studyBudgetMinutes ?? (example ? { ...ZERO_BUDGETS, 1: 60 } : ZERO_BUDGETS),
      }}
    >
      {(status === 'ready' || preview) && plannerRoute && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line pb-3 text-sm text-muted">
          <p className="max-w-[190px]">
            <strong className="font-semibold text-ink">
              {preview ? 'Planner preview' : 'Your saved planner'}
            </strong>
            <br />
            {preview ? 'Changes reset on refresh.' : 'Private to your account · SAST'}
          </p>
          <label className="text-sm">
            View date (SAST)
            <input
              aria-label="View planner date"
              type="date"
              value={day}
              onChange={(event) => {
                if (/^\d{4}-\d{2}-\d{2}$/.test(event.target.value)) setDay(event.target.value);
              }}
            />
          </label>
          {preview &&
            (hasData ? (
              <button type="button" className="text-link text-sm" onClick={() => setClearing(true)}>
                Clear preview
              </button>
            ) : (
              <button
                type="button"
                className="text-link text-sm"
                onClick={() => {
                  setData(exampleView());
                  setExample(true);
                  setDay('2026-10-19');
                }}
              >
                Load example week
              </button>
            ))}
        </div>
      )}
      {plannerRoute && uid && loading ? (
        <p role="status" className="notice">
          Loading your saved planner…
        </p>
      ) : plannerRoute && uid && error ? (
        <div role="alert" className="notice notice-error">
          <p>{error}</p>
          <button
            className="btn btn-secondary mt-4"
            onClick={() => {
              setError('');
              setLoading(true);
              setRetry((value) => value + 1);
            }}
          >
            Retry planner
          </button>
        </div>
      ) : null}
      {(!uid || !plannerRoute || loaded) && (
        <div
          key={location.pathname}
          className="content-enter"
          hidden={!!(plannerRoute && uid && (loading || error))}
          inert={!!(plannerRoute && uid && (loading || error))}
        >
          <Outlet />
        </div>
      )}
      {clearing && (
        <Modal title="Clear preview?" onClose={() => setClearing(false)}>
          <p>
            This clears this session's example and entered planner records. Your saved account
            profile is unaffected.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn btn-secondary" onClick={() => setClearing(false)}>
              Keep preview
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setData(EMPTY_VIEW);
                setExample(false);
                setDay(sastDay());
                setClearing(false);
              }}
            >
              Clear planner records
            </button>
          </div>
        </Modal>
      )}
      {(status === 'ready' || preview) && <StudyTimer uid={uid} blocks={data.blocks} />}
    </PreviewContext.Provider>
  );
}
