import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { FormField } from '@/shared/components/FormField';
import { Modal } from '@/shared/components/Modal';
import { SelectField } from '@/shared/components/SelectField';
import { SubjectLabel } from '@/shared/components/PlanningUI';
import { usePlanningPreview } from '@/features/planner/previewContext';
import { displayDue, type ViewAssessment } from '@/features/planner/planningView';
import type { AssessmentPriority, AssessmentStatus, AssessmentType } from '@/shared/types/planner';
import { usePlannerMutation } from '@/features/planner/usePlannerMutation';

export function AssessmentsPage() {
  const { data, day } = usePlanningPreview();
  const { run, busy, error: writeError, preview } = usePlannerMutation();
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState('active');
  const [editing, setEditing] = useState<ViewAssessment | 'new' | null>(null);
  const [message, setMessage] = useState('');
  const [inserted, setInserted] = useState('');
  const canAdd = data.subjects.some((s) => !s.archived);
  const filtered = data.assessments
    .filter(
      (item) =>
        (view === 'archived'
          ? item.archived
          : !item.archived &&
            (view === 'completed' ? item.status === 'Completed' : item.status !== 'Completed')) &&
        (!subject || item.subjectId === subject) &&
        (!status || item.status === status) &&
        (item.title + ' ' + item.description).toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id));
  async function save(item: ViewAssessment) {
    if (!(await run('assessments', item))) return;
    if (!data.assessments.some((assessment) => assessment.id === item.id)) setInserted(item.id);
    setEditing(null);
    setMessage(preview ? 'Assessment updated in preview.' : 'Assessment saved to your account.');
  }
  const actions = (item: ViewAssessment) => (
    <div className="flex flex-wrap gap-1">
      <button
        className="btn btn-quiet px-2"
        aria-label={`Edit ${item.title}`}
        onClick={() => setEditing(item)}
      >
        Edit
      </button>
      <button
        className="btn btn-quiet px-2"
        aria-label={`${item.archived ? 'Restore' : 'Archive'} ${item.title}`}
        onClick={() => save({ ...item, archived: !item.archived })}
      >
        {item.archived ? 'Restore' : 'Archive'}
      </button>
    </div>
  );
  return (
    <section>
      <fieldset className="contents" disabled={busy}>
        <header className="page-header">
          <div>
            <h1>Assessments</h1>
            <p className="page-description">
              What is due, what is left, and what you have finished.
            </p>
          </div>
          <button
            className="btn btn-primary"
            disabled={!canAdd}
            aria-describedby={!canAdd ? 'assessment-disabled' : undefined}
            onClick={() => {
              setMessage('');
              setEditing('new');
            }}
          >
            Add assessment
          </button>
        </header>
        {!canAdd && (
          <p id="assessment-disabled" className="notice mb-6">
            <Link className="text-link" to="/subjects">
              Add or restore a subject
            </Link>{' '}
            before creating an assessment.
          </p>
        )}
        {message && (
          <p className="notice feedback-enter mb-5" role="status">
            {message}
          </p>
        )}
        {writeError && !editing && (
          <p role="alert" className="notice notice-error">
            {writeError}
          </p>
        )}
        {busy && (
          <p role="status" className="help">
            Saving… Wait for confirmation before closing.
          </p>
        )}
        <div className="mb-6 flex flex-wrap border-b border-line" aria-label="Assessment views">
          {['active', 'completed', 'archived'].map((value) => (
            <button
              className="tab capitalize"
              key={value}
              aria-pressed={view === value}
              onClick={() => {
                setView(value);
                setStatus('');
              }}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_160px_160px]">
          <FormField
            id="assessment-search"
            label="Search assessments"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <SelectField
            id="assessment-subject-filter"
            label="Subject filter"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">All subjects</option>
            {data.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}
                {s.archived ? ' (archived)' : ''}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="assessment-status-filter"
            label="Status filter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {['To Do', 'In Progress', 'Completed'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </SelectField>
        </div>
        {(query || subject || status) && (
          <button
            className="text-link mb-3 text-sm"
            onClick={() => {
              setQuery('');
              setSubject('');
              setStatus('');
            }}
          >
            Clear filters
          </button>
        )}
        <p className="help mb-3" aria-live="polite">
          {filtered.length} {view} assessment{filtered.length === 1 ? '' : 's'} · earliest deadline
          first
        </p>
        {!filtered.length ? (
          <div className="empty">
            <h2>
              {query || subject || status
                ? 'No matching assessments'
                : view === 'active'
                  ? 'No active assessments yet'
                  : `No ${view} assessments`}
            </h2>
            <p className="mt-2 text-muted">
              {query || subject || status
                ? 'Try another search or clear the filters.'
                : 'Your work will appear here when you add or update an assessment.'}
            </p>
          </div>
        ) : (
          <>
            <table className="hidden w-full table-fixed border-collapse text-left text-sm md:table">
              <caption className="sr-only">{view} assessments ordered by deadline</caption>
              <thead className="border-y border-line text-muted">
                <tr>
                  <th className="w-[27%] py-3 pr-3 font-semibold" scope="col">
                    Assessment
                  </th>
                  <th className="w-[13%] pr-3 font-semibold" scope="col">
                    Subject
                  </th>
                  <th className="w-[17%] pr-3 font-semibold" scope="col">
                    Due (SAST)
                  </th>
                  <th className="w-[11%] pr-3 font-semibold" scope="col">
                    Priority
                  </th>
                  <th className="w-[15%] pr-3 font-semibold" scope="col">
                    Status
                  </th>
                  <th className="font-semibold" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-b border-line">
                {filtered.map((item) => (
                  <tr key={item.id} className={inserted === item.id ? 'panel-enter' : undefined}>
                    <th scope="row" className="py-5 pr-3 align-top font-normal">
                      <span className="font-semibold text-ink">{item.title}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {item.type} · {item.remainingMinutes} min left
                      </span>
                    </th>
                    <td className="py-5 pr-3 align-top">
                      <SubjectLabel id={item.subjectId} />
                    </td>
                    <td className="py-5 pr-3 align-top tabular-nums">{displayDue(item.dueAt)}</td>
                    <td className="py-5 pr-3 align-top">
                      <Priority value={item.priority} />
                    </td>
                    <td className="py-5 pr-3 align-top">{item.status}</td>
                    <td className="py-3 align-top">{actions(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-line border-y border-line md:hidden">
              {filtered.map((item) => (
                <li className={`py-5 ${inserted === item.id ? 'panel-enter' : ''}`} key={item.id}>
                  <div className="flex flex-wrap justify-between gap-2">
                    <SubjectLabel id={item.subjectId} />
                    <Priority value={item.priority} />
                  </div>
                  <h2 className="mt-3 text-lg">{item.title}</h2>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    <dt className="text-muted">Due</dt>
                    <dd className="tabular-nums">{displayDue(item.dueAt)} SAST</dd>
                    <dt className="text-muted">Status</dt>
                    <dd>{item.status}</dd>
                    <dt className="text-muted">Work left</dt>
                    <dd>
                      {item.remainingMinutes} min · {item.type}
                    </dd>
                  </dl>
                  <div className="mt-3">{actions(item)}</div>
                </li>
              ))}
            </ul>
          </>
        )}
        {editing && (
          <AssessmentEditor
            item={editing === 'new' ? undefined : editing}
            day={day}
            close={() => setEditing(null)}
            save={save}
            busy={busy}
            writeError={writeError}
            preview={preview}
          />
        )}
      </fieldset>
    </section>
  );
}
function Priority({ value }: { value: AssessmentPriority }) {
  return (
    <span
      className={`badge ${value === 'High' ? '!bg-[#fcedee] !text-danger' : value === 'Medium' ? '!bg-[#fff2cf] !text-warning' : ''}`}
    >
      {value}
    </span>
  );
}

function AssessmentEditor({
  item,
  day,
  close,
  save,
  busy,
  writeError,
  preview,
}: {
  item?: ViewAssessment;
  day: string;
  close: () => void;
  save: (item: ViewAssessment) => void;
  busy: boolean;
  writeError: string;
  preview: boolean;
}) {
  const { data, available } = usePlanningPreview();
  const [error, setError] = useState('');
  const [status, setStatus] = useState<AssessmentStatus>(item?.status ?? 'To Do');
  const [remainingDraft, setRemainingDraft] = useState(String(item?.remainingMinutes || 60));
  const [id] = useState(() => item?.id ?? crypto.randomUUID());
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const get = (key: string) => String(values.get(key) ?? '');
    const title = get('title').trim();
    const remaining = status === 'Completed' ? 0 : Number(get('remaining'));
    if (
      !title ||
      title.length > 120 ||
      !get('subject') ||
      !Number.isFinite(Date.parse(get('due') + ':00+02:00')) ||
      (status !== 'Completed' &&
        (!/^\d+$/.test(get('remaining')) || remaining < 1 || remaining > 14400))
    ) {
      setError(
        'Enter a title, subject and deadline. Incomplete work needs 1–14400 whole minutes remaining; reopening completed work needs a new estimate.',
      );
      return;
    }
    save({
      id,
      revision: item?.revision,
      subjectId: get('subject'),
      title,
      type: get('type') as AssessmentType,
      description: get('description').trim(),
      dueAt: get('due') + ':00+02:00',
      priority: get('priority') as AssessmentPriority,
      status,
      remainingMinutes: remaining,
      archived: item?.archived ?? false,
    });
  }
  return (
    <Modal
      title={item ? 'Edit assessment' : 'Add assessment'}
      onClose={close}
      busy={busy}
      suspended={!available}
    >
      <form className="space-y-5" onSubmit={submit}>
        {writeError && (
          <p role="alert" className="notice notice-error">
            {writeError}
          </p>
        )}
        {error && (
          <p role="alert" className="notice notice-error feedback-enter">
            {error}
          </p>
        )}
        <FormField
          data-initial-focus
          id="assessment-title"
          name="title"
          label="Assessment title"
          required
          maxLength={120}
          defaultValue={item?.title}
        />
        <SelectField
          id="assessment-subject"
          name="subject"
          label="Subject"
          required
          defaultValue={item?.subjectId}
        >
          {data.subjects
            .filter((s) => !s.archived || s.id === item?.subjectId)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
              </option>
            ))}
        </SelectField>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="assessment-type"
            name="type"
            label="Assessment type"
            defaultValue={item?.type ?? 'Assignment'}
          >
            {['Assignment', 'Test', 'Exam', 'Project'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </SelectField>
          <SelectField
            id="assessment-priority"
            name="priority"
            label="Priority"
            defaultValue={item?.priority ?? 'Medium'}
          >
            {['High', 'Medium', 'Low'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </SelectField>
        </div>
        <FormField
          id="assessment-due"
          name="due"
          label="Deadline (SAST)"
          type="datetime-local"
          min="2000-01-01T00:00"
          max="2099-12-31T23:59"
          required
          defaultValue={item?.dueAt.slice(0, 16) ?? day + 'T12:00'}
        />
        <SelectField
          id="assessment-status"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as AssessmentStatus)}
        >
          {['To Do', 'In Progress', 'Completed'].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </SelectField>
        {status !== 'Completed' ? (
          <FormField
            id="assessment-remaining"
            name="remaining"
            label="Remaining effort (minutes)"
            type="number"
            inputMode="numeric"
            min={1}
            max={14400}
            step={1}
            required
            value={remainingDraft}
            onChange={(event) => setRemainingDraft(event.target.value)}
            help="Your estimate of work still needed. Planning a block does not reduce it."
          />
        ) : (
          <p className="help">
            Completed work has zero minutes remaining. Existing study blocks are retained.
          </p>
        )}
        <div className="field">
          <label htmlFor="assessment-description">Notes (optional)</label>
          <textarea
            id="assessment-description"
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={item?.description}
          />
        </div>
        <p className="help">
          {preview
            ? 'Saved in this preview session only.'
            : 'Save to your private account. Wait for confirmation.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary">Save assessment</button>
          <button className="btn btn-secondary" type="button" onClick={close}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
