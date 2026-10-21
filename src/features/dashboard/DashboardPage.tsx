import { CtuSavedPanel } from '@/features/ctu/CtuSavedPanel';
import { Link } from 'react-router';
import { useAuth } from '@/features/auth/authContext';
import { usePlanningPreview } from '@/features/planner/previewContext';
import {
  agendaForDay,
  allocation,
  completion,
  displayDay,
  displayDue,
  rankedAssessments,
  weekday,
} from '@/features/planner/planningView';
import { SubjectLabel, WeekControls } from '@/shared/components/PlanningUI';
import { useCurrentTime } from '@/shared/hooks/useCurrentTime';
import { getWorkloadSummary } from './utils/workload';

export function DashboardPage() {
  const now = useCurrentTime();
  const { data, day, setDay, budgets, preview } = usePlanningPreview();
  const { profile } = useAuth();
  const agenda = agendaForDay(data, day);
  const progress = completion(data);
  const {
    allocatedMinutes: used,
    budgetMinutes: budget,
    isOverloaded,
    excessMinutes,
  } = getWorkloadSummary(allocation(data, day), budgets[weekday(day)]);
  const scale = Math.max(used, budget, 1);
  const suggestion = rankedAssessments(data, now)[0];
  const next = data.assessments
    .filter((a) => !a.archived && a.status !== 'Completed')
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  const activeSubjects = data.subjects.some((s) => !s.archived);
  const canPlan = data.assessments.some(
    (a) =>
      !a.archived &&
      a.status !== 'Completed' &&
      data.subjects.some((s) => s.id === a.subjectId && !s.archived),
  );
  const action = canPlan
    ? { to: '/planner', label: 'Plan study time' }
    : activeSubjects
      ? { to: '/assessments', label: 'Add an assessment' }
      : {
          to: '/subjects',
          label: data.subjects.length ? 'Restore a subject' : 'Add your first subject',
        };
  return (
    <section>
      <header className="page-header">
        <div>
          <h1>This week</h1>
          <p className="page-description">A place for your work, and the time it needs.</p>
        </div>
        <Link className="btn btn-primary" to={action.to}>
          {action.label}
        </Link>
      </header>
      <WeekControls />
      {import.meta.env.VITE_CTU_PROTOTYPE === 'true' && <CtuSavedPanel compact />}
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section>
          <div className="section-heading">
            <div>
              <h2>Your agenda</h2>
              <p className="help mt-1">
                {displayDay(day, { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="max-w-[180px]">
              <label className="sr-only" htmlFor="agenda-date">
                Agenda date
              </label>
              <input
                id="agenda-date"
                type="date"
                value={day}
                onChange={(e) => {
                  if (e.target.value) setDay(e.target.value);
                }}
              />
            </div>
          </div>
          {agenda.length ? (
            <ol className="divide-y divide-line border-y border-line">
              {agenda.map((item) => (
                <li
                  key={item.kind + item.id}
                  className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 py-5"
                >
                  <div className="text-sm font-semibold tabular-nums text-ink">
                    {item.start.slice(11, 16)}
                    {item.end && (
                      <span className="block text-xs font-normal text-muted">
                        {item.end.slice(11, 16)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted">
                      {item.kind} · {item.detail}
                    </p>
                    <h3 className="mt-1">{item.title}</h3>
                    <div className="mt-2">
                      <SubjectLabel id={item.subjectId} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="empty">
              <h3>No plans for this day</h3>
              <p className="mt-2 text-sm text-muted">
                {activeSubjects
                  ? 'Add a class or reserve a study block for something you need to finish.'
                  : preview
                    ? 'Start by adding your subjects, or load the example week above to explore.'
                    : 'Start by adding your subjects, then add class times and assessment deadlines.'}
              </p>
              <Link
                className="text-link mt-3 text-sm"
                to={activeSubjects ? '/planner' : '/subjects'}
              >
                {activeSubjects ? 'Open weekly planner' : 'Set up subjects'}
              </Link>
            </div>
          )}
          <section className="mt-8 border-b border-line pb-6">
            <div className="section-heading">
              <h2>Study time</h2>
              <Link className="text-link text-sm" to="/settings">
                Edit budgets
              </Link>
            </div>
            <p className="text-sm">
              <strong className="text-ink tabular-nums">{used} min reserved</strong>{' '}
              <span className="text-muted">/ {budget} min budget</span>
            </p>
            <div
              className="relative my-3 h-3 overflow-visible rounded-sm bg-[#e6eae5]"
              role="img"
              aria-label={`${used} minutes reserved against a ${budget} minute budget`}
            >
              <div
                className={`data-fill h-full rounded-sm ${isOverloaded ? 'bg-[#805600]' : 'bg-accent'}`}
                style={{ width: `${(used / scale) * 100}%` }}
              />
              <span
                className="absolute top-[-4px] h-5 w-0.5 bg-ink"
                style={{ left: `calc(${(budget / scale) * 100}% - 1px)` }}
                aria-hidden="true"
              />
            </div>
            <p className={`text-sm ${isOverloaded ? 'font-semibold text-warning' : 'text-muted'}`}>
              {isOverloaded
                ? `${excessMinutes} min over budget. Move a block or adjust your budget.`
                : `${budget - used} min available for study.`}
            </p>
            <p className="help mt-2">
              Planned and done blocks count; classes and cancelled blocks do not.{' '}
              {profile
                ? 'Budget from your saved profile.'
                : 'Example budgets apply only after loading the example week.'}
            </p>
          </section>
        </section>
        <div className="space-y-8">
          <section className="border-t-2 border-accent pt-5">
            <h2>Where to start</h2>
            {suggestion ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <SubjectLabel id={suggestion.item.subjectId} />
                  {suggestion.isQuickTask && <span className="badge">Quick task</span>}
                </div>
                <h3 className="mt-2 text-lg">{suggestion.item.title}</h3>
                <p className="mt-2 text-sm text-muted">{suggestion.reason}</p>
                <p className="mt-2 text-sm tabular-nums">
                  {displayDue(suggestion.item.dueAt)} SAST · {suggestion.item.remainingMinutes} min
                  left
                </p>
                {next && next.id !== suggestion.item.id && (
                  <p className="help mt-4">
                    Earliest deadline: {next.title}, {displayDue(next.dueAt)}.
                  </p>
                )}
                <Link className="text-link mt-3 text-sm" to="/assessments">
                  Review assessments →
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">
                {import.meta.env.VITE_CTU_PROTOTYPE === 'true'
                  ? 'No incomplete assessments in your study plan. CTU source deadlines are listed separately until planning details are added.'
                  : 'No incomplete assessments. Add your next deadline when you are ready.'}
              </p>
            )}
          </section>
          <section className="border-t border-line pt-5">
            <h2>
              {import.meta.env.VITE_CTU_PROTOTYPE === 'true'
                ? 'Study plan progress'
                : 'Assessment progress'}
            </h2>
            <p className="mt-4 text-3xl tabular-nums text-ink">
              {progress.done}
              <span className="text-base text-muted"> / {progress.total} completed</span>
            </p>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-sm bg-[#e6eae5]"
              role="img"
              aria-label={`${progress.done} of ${progress.total} assessments completed`}
            >
              <div
                className="data-fill h-full bg-accent"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="mt-3 text-sm tabular-nums text-muted">
              {progress.remaining} min estimated work left
            </p>
            <p className="help mt-2">
              All non-archived assessments, across all weeks. Completion is based on status.
              {import.meta.env.VITE_CTU_PROTOTYPE === 'true' &&
                ' CTU source deadlines without planning details are excluded.'}
            </p>
          </section>
          <section className="border-t border-line pt-5">
            <h2 className="text-base">Your next step</h2>
            <p className="help mt-2">
              {suggestion
                ? 'Keep sessions small enough to fit the day. Start with one concrete task.'
                : 'Subjects connect your classes, assessments and study blocks.'}
            </p>
            <Link className="text-link mt-1 text-sm" to={activeSubjects ? '/subjects' : '/account'}>
              {activeSubjects ? 'Review subjects & classes' : 'Check account access'}
            </Link>
          </section>
        </div>
      </div>
    </section>
  );
}
