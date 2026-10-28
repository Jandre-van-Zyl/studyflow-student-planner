import { useState, type FormEvent } from 'react';
import { FormField } from '@/shared/components/FormField';
import { Modal } from '@/shared/components/Modal';
import { SelectField } from '@/shared/components/SelectField';
import { SubjectLabel } from '@/shared/components/PlanningUI';
import { subjectDisplay } from '@/shared/subjectDisplay';
import { WEEKDAYS } from '@/features/auth/profileValidation';
import { usePlanningPreview } from '@/features/planner/previewContext';
import {
  addDays,
  monday,
  displayDay,
  type ViewClass,
  type ViewSubject,
} from '@/features/planner/planningView';
import type { IsoWeekday, SubjectColour } from '@/shared/types/planner';
import { usePlannerMutation } from '@/features/planner/usePlannerMutation';
import { validateClassSlot, validateSubject } from './subjectValidation';

export function SubjectsPage() {
  const { data, day } = usePlanningPreview();
  const { run, busy, error: writeError, preview } = usePlannerMutation();
  const [archived, setArchived] = useState(false);
  const [subject, setSubject] = useState<ViewSubject | 'new' | null>(null);
  const [slot, setSlot] = useState<ViewClass | 'new' | null>(null);
  const [message, setMessage] = useState('');
  const [inserted, setInserted] = useState('');
  const active = data.subjects.filter((item) => !item.archived);
  const listed = data.subjects.filter((item) => item.archived === archived);
  async function changeSubject(item: ViewSubject) {
    const created = !data.subjects.some((subject) => subject.id === item.id);
    if (!(await run('subjects', item))) return;
    if (created) {
      setInserted(item.id);
      setArchived(false);
    }
    setSubject(null);
    setMessage(preview ? 'Subject updated in preview.' : 'Subject saved to your account.');
  }
  async function changeClass(item: ViewClass) {
    if (!(await run('classes', item))) return;
    if (!data.classes.some((slot) => slot.id === item.id)) setInserted(item.id);
    setSlot(null);
    setMessage(preview ? 'Class updated in preview.' : 'Class saved to your account.');
  }
  return (
    <section>
      <fieldset className="contents" disabled={busy}>
        <header className="page-header">
          <div>
            <h1>Subjects &amp; classes</h1>
            <p className="page-description">
              The subjects you take, and the times you need to be there.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setMessage('');
              setSubject('new');
            }}
          >
            Add subject
          </button>
        </header>
        {message && (
          <p role="status" className="notice feedback-enter mb-5">
            {message}
          </p>
        )}
        {writeError && !subject && !slot && (
          <p role="alert" className="notice notice-error">
            {writeError}
          </p>
        )}
        {busy && (
          <p role="status" className="help">
            Saving… Wait for confirmation before closing.
          </p>
        )}
        <div className="mb-6 flex border-b border-line">
          <button className="tab" aria-pressed={!archived} onClick={() => setArchived(false)}>
            Active ({active.length})
          </button>
          <button className="tab" aria-pressed={archived} onClick={() => setArchived(true)}>
            Archived ({data.subjects.length - active.length})
          </button>
        </div>
        {!listed.length ? (
          <div className="empty">
            <h2>{archived ? 'No archived subjects' : 'Start with your subjects'}</h2>
            <p className="mt-2 max-w-lg text-muted">
              {archived
                ? 'Archived subjects and their history will remain here.'
                : 'Add a subject code and name, then give its classes a place in your week.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line border-b border-line">
            {listed.map((item) => (
              <li
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-4 py-5 ${inserted === item.id ? 'panel-enter' : ''}`}
              >
                <div className="min-w-0">
                  <SubjectLabel id={item.id} />
                  {subjectDisplay(item) !== item.name && (
                    <h2 className="mt-1 text-lg">{item.name}</h2>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {!archived && (
                    <button
                      className="btn btn-quiet"
                      aria-label={`Edit ${subjectDisplay(item)}`}
                      onClick={() => setSubject(item)}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    className="btn btn-quiet"
                    aria-label={`${archived ? 'Restore' : 'Archive'} ${subjectDisplay(item)}`}
                    onClick={() => changeSubject({ ...item, archived: !item.archived })}
                  >
                    {archived ? 'Restore' : 'Archive'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <section className="mt-10">
          <div className="section-heading">
            <div>
              <h2>Weekly classes</h2>
              <p className="help mt-1">
                Recurring class times. Archived subjects stop appearing in your agenda.
              </p>
            </div>
            <button
              className="btn btn-secondary"
              disabled={!active.length}
              aria-describedby={!active.length ? 'class-disabled' : undefined}
              onClick={() => setSlot('new')}
            >
              Add class
            </button>
          </div>
          {!active.length && (
            <p id="class-disabled" className="help mb-4">
              Add or restore a subject before adding a class.
            </p>
          )}
          {!data.classes.length ? (
            <p className="border-t border-line py-6 text-muted">No class times yet.</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {data.classes.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-center justify-between gap-3 py-4 ${inserted === item.id ? 'panel-enter' : ''}`}
                >
                  <div>
                    <SubjectLabel id={item.subjectId} />
                    <p className="mt-1 font-semibold tabular-nums">
                      {WEEKDAYS.find((w) => w.key === item.weekday)?.label} · {item.startTime}–
                      {item.endTime}
                      {item.archived ? ' · Archived' : ''}
                    </p>
                    <p className="help">
                      {item.location || 'No location set'} · {displayDay(item.activeFrom)}–
                      {displayDay(item.activeTo, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="btn btn-quiet"
                      aria-label={`Edit ${item.startTime} class`}
                      onClick={() => setSlot(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-quiet"
                      aria-label={`${item.archived ? 'Restore' : 'Archive'} ${item.startTime} class`}
                      onClick={() => changeClass({ ...item, archived: !item.archived })}
                    >
                      {item.archived ? 'Restore' : 'Archive'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        {subject && (
          <SubjectEditor
            item={subject === 'new' ? undefined : subject}
            subjects={data.subjects}
            close={() => setSubject(null)}
            save={changeSubject}
            busy={busy}
            writeError={writeError}
            preview={preview}
          />
        )}
        {slot && (
          <ClassEditor
            item={slot === 'new' ? undefined : slot}
            subjects={data.subjects}
            day={day}
            close={() => setSlot(null)}
            save={changeClass}
            busy={busy}
            writeError={writeError}
          />
        )}
      </fieldset>
    </section>
  );
}

function SubjectEditor({
  item,
  subjects,
  close,
  save,
  busy,
  writeError,
  preview,
}: {
  item?: ViewSubject;
  subjects: ViewSubject[];
  close: () => void;
  save: (value: ViewSubject) => void;
  busy: boolean;
  writeError: string;
  preview: boolean;
}) {
  const { available } = usePlanningPreview();
  const [error, setError] = useState('');
  const [id] = useState(() => item?.id ?? crypto.randomUUID());
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const name = String(values.get('name')).trim();
    const code = String(values.get('code')).trim().toUpperCase();
    const invalid = validateSubject(name, code, id, subjects);
    if (invalid) {
      setError(invalid);
      return;
    }
    save({
      id,
      revision: item?.revision,
      name,
      code,
      colour: String(values.get('colour')) as SubjectColour,
      archived: item?.archived ?? false,
    });
  }
  return (
    <Modal
      title={item ? 'Edit subject' : 'Add subject'}
      onClose={close}
      busy={busy}
      suspended={!available}
    >
      <form onSubmit={submit} className="space-y-5">
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
          id="subject-name"
          name="name"
          label="Subject name"
          defaultValue={item?.name}
          required
          maxLength={80}
        />
        <FormField
          id="subject-code"
          name="code"
          label="Subject code"
          defaultValue={item?.code}
          required
          maxLength={20}
          help="1–20 letters, digits, hyphens or underscores, such as SE2. Each code must be unique."
        />
        <SelectField
          id="subject-colour"
          name="colour"
          label="Subject colour"
          defaultValue={item?.colour ?? 'teal'}
        >
          {['teal', 'sky', 'amber', 'rose', 'violet', 'indigo'].map((value) => (
            <option key={value} value={value}>
              {value[0]?.toUpperCase()}
              {value.slice(1)}
            </option>
          ))}
        </SelectField>
        <p className="help">
          {preview
            ? 'This subject is stored in the preview for this session.'
            : 'Save to your private account. Wait for confirmation.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" type="submit">
            Save subject
          </button>
          <button className="btn btn-secondary" type="button" onClick={close}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
function ClassEditor({
  item,
  subjects,
  day,
  close,
  save,
  busy,
  writeError,
}: {
  item?: ViewClass;
  subjects: ViewSubject[];
  day: string;
  close: () => void;
  save: (value: ViewClass) => void;
  busy: boolean;
  writeError: string;
}) {
  const { available } = usePlanningPreview();
  const [error, setError] = useState('');
  const [id] = useState(() => item?.id ?? crypto.randomUUID());
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const get = (key: string) => String(values.get(key));
    const invalid = validateClassSlot(
      get('subject'),
      get('start'),
      get('end'),
      get('from'),
      get('to'),
    );
    if (invalid) {
      setError(invalid);
      return;
    }
    save({
      id,
      revision: item?.revision,
      subjectId: get('subject'),
      weekday: Number(get('weekday')) as IsoWeekday,
      startTime: get('start'),
      endTime: get('end'),
      activeFrom: get('from'),
      activeTo: get('to'),
      location: get('location').trim(),
      archived: item?.archived ?? false,
    });
  }
  return (
    <Modal
      title={item ? 'Edit class' : 'Add class'}
      onClose={close}
      busy={busy}
      suspended={!available}
    >
      <form onSubmit={submit} className="space-y-5">
        {writeError && (
          <p role="alert" className="notice notice-error">
            {writeError}
          </p>
        )}
        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}
        <SelectField
          data-initial-focus
          id="class-subject"
          name="subject"
          label="Subject"
          defaultValue={item?.subjectId}
          required
        >
          {subjects
            .filter((s) => !s.archived || s.id === item?.subjectId)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {subjectDisplay(s, true)}
              </option>
            ))}
        </SelectField>
        <SelectField
          id="class-weekday"
          name="weekday"
          label="Weekday"
          defaultValue={item?.weekday ?? 1}
        >
          {WEEKDAYS.map((w) => (
            <option key={w.key} value={w.key}>
              {w.label}
            </option>
          ))}
        </SelectField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="class-start"
            name="start"
            label="Start time (SAST)"
            type="time"
            defaultValue={item?.startTime ?? '09:00'}
            required
          />
          <FormField
            id="class-end"
            name="end"
            label="End time (SAST)"
            type="time"
            defaultValue={item?.endTime ?? '10:00'}
            required
          />
          <FormField
            id="class-from"
            name="from"
            label="Active from"
            type="date"
            min="2000-01-01"
            max="2099-12-31"
            defaultValue={item?.activeFrom ?? monday(day)}
            required
          />
          <FormField
            id="class-to"
            name="to"
            label="Active until"
            type="date"
            min="2000-01-01"
            max="2099-12-31"
            defaultValue={item?.activeTo ?? addDays(monday(day), 6)}
            required
          />
        </div>
        <FormField
          id="class-location"
          name="location"
          label="Location (optional)"
          defaultValue={item?.location}
          maxLength={120}
        />
        <p className="help">
          Classes repeat weekly within this date range. Extend Active until for the rest of your
          term. Times use SAST.
        </p>
        <div className="flex gap-3">
          <button className="btn btn-primary">Save class</button>
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
