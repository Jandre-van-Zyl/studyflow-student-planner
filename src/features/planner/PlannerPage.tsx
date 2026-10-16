import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { Modal } from '@/shared/components/Modal';
import { SubjectLabel, WeekControls } from '@/shared/components/PlanningUI';
import type { StudyBlockStatus } from '@/shared/types/planner';
import { usePlanningPreview } from './previewContext';
import { useCurrentTime } from '@/shared/hooks/useCurrentTime';
import {
  addDays,
  agendaForDay,
  allocation,
  blockConflicts,
  displayDay,
  duration,
  monday,
  validateBlock,
  weekday,
  type AgendaItem,
  type ViewBlock,
} from './planningView';

export function PlannerPage() {
  const now = useCurrentTime();
  const { data, setData, day, setDay, budgets } = usePlanningPreview();
  const [editing, setEditing] = useState<ViewBlock | 'new' | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [message, setMessage] = useState('');
  const [inserted, setInserted] = useState('');
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday(day), i));
  const canAdd = data.assessments.some(
    (a) =>
      !a.archived &&
      a.status !== 'Completed' &&
      data.subjects.some((s) => s.id === a.subjectId && !s.archived),
  );
  function save(item: ViewBlock) {
    if (!data.blocks.some((block) => block.id === item.id)) setInserted(item.id);
    setData((current) => ({
      ...current,
      blocks: current.blocks.some((b) => b.id === item.id)
        ? current.blocks.map((b) => (b.id === item.id ? item : b))
        : [...current.blocks, item],
    }));
    setEditing(null);
    setMessage('Study block updated in preview.');
  }
  function eventView(item: AgendaItem, scope: string) {
    const block = data.blocks.find((b) => b.id === item.id);
    const future = !!block && Date.parse(block.startAt) > now;
    return (
      <li
        key={item.kind + item.id}
        className={`border-t border-line py-4 ${inserted === item.id ? 'panel-enter' : ''}`}
      >
        <p className="text-xs font-semibold text-muted">
          {item.kind} ·{' '}
          <span className="tabular-nums">
            {item.start.slice(11, 16)}
            {item.end ? '–' + item.end.slice(11, 16) : ''}
          </span>
        </p>
        <h3 className="mt-2 text-sm">{item.title}</h3>
        <div className="mt-2">
          <SubjectLabel id={item.subjectId} />
        </div>
        <p className="mt-1 text-xs text-muted">{item.detail}</p>
        {block && (
          <div className="mt-2 flex flex-wrap">
            <button
              className="btn btn-quiet px-2"
              aria-label={`Edit ${block.title}`}
              onClick={() => setEditing(block)}
            >
              Edit
            </button>
            {scope !== 'week' && (
              <button
                className="btn btn-quiet px-2"
                aria-label={`Cancel ${block.title}`}
                onClick={() => save({ ...block, status: 'Cancelled' })}
              >
                Cancel
              </button>
            )}
            {scope !== 'week' && block.status !== 'Done' && (
              <>
                <button
                  className="btn btn-quiet px-2"
                  disabled={future}
                  aria-describedby={future ? `future-${scope}-${block.id}` : undefined}
                  onClick={() => {
                    if (Date.parse(block.startAt) <= Date.now()) save({ ...block, status: 'Done' });
                  }}
                >
                  Done
                </button>
                {future && (
                  <span id={`future-${scope}-${block.id}`} className="help text-xs">
                    Available after start
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </li>
    );
  }
  function dayView(value: string, scope: string) {
    const events = agendaForDay(data, value);
    const used = allocation(data, value);
    const budget = budgets[weekday(value)];
    return (
      <>
        <p className="mb-4 text-xs tabular-nums text-muted">
          {used} / {budget} min study
        </p>
        {used > budget && (
          <p className="mb-3 text-xs font-semibold text-warning">{used - budget} min over budget</p>
        )}
        {events.length ? (
          <ul>{events.map((item) => eventView(item, scope))}</ul>
        ) : (
          <p className="border-t border-line py-5 text-sm text-muted">No plans for this day.</p>
        )}
      </>
    );
  }
  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Weekly planner</h1>
          <p className="page-description">Classes, study time and deadlines. One week at a time.</p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!canAdd}
          aria-describedby={!canAdd ? 'block-disabled' : undefined}
          onClick={() => {
            setMessage('');
            setEditing('new');
          }}
        >
          Add study block
        </button>
      </header>
      {!canAdd && (
        <p id="block-disabled" className="notice mb-6">
          <Link to="/assessments" className="text-link">
            Add an incomplete assessment
          </Link>{' '}
          in an active subject before planning study time.
        </p>
      )}
      {message && (
        <p role="status" className="notice feedback-enter mb-5">
          {message}
        </p>
      )}
      <WeekControls />
      <div className="my-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <span>Class · recurring timetable</span>
        <span>Study · reserved time</span>
        <span>Deadline · due time</span>
      </div>
      <div className="hidden grid-cols-7 divide-x divide-line xl:grid">
        {days.map((value) => (
          <section key={value} className="min-w-0 px-2 first:pl-0 last:pr-0">
            <h2 className={`mb-2 text-sm ${value === day ? 'text-accent' : ''}`}>
              {displayDay(value, { weekday: 'short', day: 'numeric' })}
            </h2>
            {dayView(value, 'week')}
          </section>
        ))}
      </div>
      <div className="xl:hidden">
        <div className="mb-6 grid grid-cols-4 gap-2 sm:grid-cols-7" aria-label="Choose day">
          {days.map((value) => (
            <button
              key={value}
              className={`btn flex-col gap-0 px-1 ${value === day ? 'btn-primary' : 'btn-secondary'}`}
              aria-pressed={value === day}
              onClick={() => setDay(value)}
            >
              <span className="text-xs">{displayDay(value, { weekday: 'short' })}</span>
              <span>{displayDay(value, { day: 'numeric' })}</span>
            </button>
          ))}
        </div>
        <section key={day} className="panel-enter">
          <h2 className="mb-3">
            {displayDay(day, { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          {dayView(day, 'day')}
        </section>
      </div>
      <div className="mt-8 border-t border-line pt-3">
        <button
          className="text-link text-sm"
          aria-expanded={showCancelled}
          onClick={() => setShowCancelled(!showCancelled)}
        >
          Cancelled blocks ({data.blocks.filter((b) => b.status === 'Cancelled').length})
        </button>
        {showCancelled && (
          <ul className="panel-enter divide-y divide-line">
            {data.blocks
              .filter((b) => b.status === 'Cancelled')
              .map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-semibold">{b.title}</p>
                    <p className="help">
                      {displayDay(b.startAt.slice(0, 10))} · {b.startAt.slice(11, 16)}–
                      {b.endAt.slice(11, 16)} · Cancelled
                    </p>
                  </div>
                  <button className="btn btn-quiet" onClick={() => setEditing(b)}>
                    Edit cancelled block
                  </button>
                </li>
              ))}
            {!data.blocks.some((b) => b.status === 'Cancelled') && (
              <li className="py-4 text-sm text-muted">
                No cancelled blocks. Cancelling retains a block's history.
              </li>
            )}
          </ul>
        )}
      </div>
      {editing && (
        <BlockEditor
          item={editing === 'new' ? undefined : editing}
          close={() => setEditing(null)}
          save={save}
        />
      )}
    </section>
  );
}

function BlockEditor({
  item,
  close,
  save,
}: {
  item?: ViewBlock;
  close: () => void;
  save: (block: ViewBlock) => void;
}) {
  const { data, day, budgets } = usePlanningPreview();
  const [error, setError] = useState('');
  const [pending, setPending] = useState<ViewBlock | null>(null);
  const warning = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pending) warning.current?.focus();
  }, [pending]);
  const choices = data.assessments.filter(
    (a) =>
      a.id === item?.assessmentId ||
      (!a.archived &&
        a.status !== 'Completed' &&
        data.subjects.some((s) => s.id === a.subjectId && !s.archived)),
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const get = (key: string) => String(values.get(key) ?? '');
    const block: ViewBlock = {
      id: item?.id ?? crypto.randomUUID(),
      assessmentId: get('assessment'),
      title: get('title').trim(),
      startAt: get('date') + 'T' + get('start') + ':00+02:00',
      endAt: get('date') + 'T' + get('end') + ':00+02:00',
      status: (get('status') || 'Planned') as StudyBlockStatus,
    };
    const invalid = validateBlock(block);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (block.status === 'Done' && Date.parse(block.startAt) > Date.now()) {
      setError('A future study block cannot be marked done before its start time.');
      return;
    }
    setError('');
    if (block.status !== 'Cancelled' && blockConflicts(data, block).length) {
      setPending(block);
      return;
    }
    save(block);
  }
  const conflicts = pending ? blockConflicts(data, pending) : [];
  const reserved = pending
    ? allocation(data, pending.startAt.slice(0, 10)) -
      (item &&
      item.status !== 'Cancelled' &&
      item.startAt.slice(0, 10) === pending.startAt.slice(0, 10)
        ? duration(item.startAt, item.endAt)
        : 0) +
      duration(pending.startAt, pending.endAt)
    : 0;
  return (
    <Modal title={item ? 'Edit study block' : 'Add study block'} onClose={close}>
      <form
        className="space-y-5"
        onSubmit={submit}
        onChange={() => {
          setPending(null);
          setError('');
        }}
      >
        {error && (
          <p className="notice notice-error feedback-enter" role="alert">
            {error}
          </p>
        )}
        <SelectField
          data-initial-focus
          id="block-assessment"
          name="assessment"
          label="Linked assessment"
          required
          defaultValue={item?.assessmentId}
        >
          {choices.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </SelectField>
        <FormField
          id="block-title"
          name="title"
          label="Study title"
          required
          maxLength={120}
          defaultValue={item?.title}
          help="A concrete next step, such as Draft the requirements."
        />
        <FormField
          id="block-date"
          name="date"
          label="Study date"
          type="date"
          required
          defaultValue={item?.startAt.slice(0, 10) ?? day}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="block-start"
            name="start"
            label="Start time (SAST)"
            type="time"
            required
            defaultValue={item?.startAt.slice(11, 16) ?? '09:00'}
          />
          <FormField
            id="block-end"
            name="end"
            label="End time (SAST)"
            type="time"
            required
            defaultValue={item?.endAt.slice(11, 16) ?? '09:45'}
          />
        </div>
        {item && (
          <SelectField
            id="block-status"
            name="status"
            label="Block status"
            defaultValue={item.status}
          >
            {['Planned', 'Done', 'Cancelled'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </SelectField>
        )}
        <p className="help">
          15–180 minutes on one SAST day. Reserving time does not change your remaining effort.
        </p>
        {pending && (
          <div
            ref={warning}
            tabIndex={-1}
            className="notice notice-warning feedback-enter"
            role="alert"
          >
            <h3 className="text-warning">This time overlaps</h3>
            <ul className="mt-2 list-disc pl-5">
              {conflicts.map((c) => (
                <li key={c.id}>
                  {c.title} · {c.start.slice(11, 16)}–{c.end?.slice(11, 16)}
                </li>
              ))}
            </ul>
            {reserved > budgets[weekday(pending.startAt.slice(0, 10))] && (
              <p className="mt-2">
                {reserved - budgets[weekday(pending.startAt.slice(0, 10))]} minutes over this day's
                budget.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setPending(null);
                  document.getElementById('block-start')?.focus();
                }}
              >
                Change time
              </button>
              <button type="button" className="btn btn-primary" onClick={() => save(pending)}>
                Save with overlap
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" disabled={!!pending}>
            Save study block
          </button>
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
