import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useAuth } from '@/features/auth/authContext';
import { Modal } from '@/shared/components/Modal';
import { PreviewContext } from './previewContext';
import { EMPTY_VIEW, ZERO_BUDGETS, exampleView, sastDay } from './planningView';

export function PlanningWorkspace() {
  const { profile, status } = useAuth();
  const location = useLocation();
  const [data, setData] = useState(EMPTY_VIEW);
  const [day, setDay] = useState(sastDay);
  const [example, setExample] = useState(false);
  const [clearing, setClearing] = useState(false);
  const hasData = data.subjects.length > 0 || data.assessments.length > 0 || data.blocks.length > 0;
  return (
    <PreviewContext.Provider
      value={{
        data,
        setData,
        day,
        setDay,
        budgets:
          profile?.studyBudgetMinutes ?? (example ? { ...ZERO_BUDGETS, 1: 60 } : ZERO_BUDGETS),
      }}
    >
      {(status === 'ready' || status === 'disabled') && location.pathname !== '/account' && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line pb-3 text-sm text-muted">
          <p className="max-w-[190px]">
            <strong className="font-semibold text-ink">Planner preview</strong>
            <br />
            Changes reset on refresh.
          </p>
          {hasData ? (
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
          )}
        </div>
      )}
      <div key={location.pathname} className="content-enter">
        <Outlet />
      </div>
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
    </PreviewContext.Provider>
  );
}
