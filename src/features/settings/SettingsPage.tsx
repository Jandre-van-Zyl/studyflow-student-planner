import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/features/auth/authContext';
import { accountErrorMessage } from '@/features/auth/errors';
import { saveProfile } from '@/features/auth/profileService';
import { WEEKDAYS, validateProfileInput } from '@/features/auth/profileValidation';
import { FormField } from '@/shared/components/FormField';
import { type StudyBudgetMinutes, type UserProfile } from '@/shared/types/planner';

export function SettingsPage() {
  const { status, user, profile } = useAuth();
  if (status === 'disabled')
    return (
      <section className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-semibold text-ink">Profile and study budgets</h1>
        <p className="mt-4 leading-7">
          Settings are unavailable in this preview. A signed-in account is needed to save your
          profile.
        </p>
        <Link to="/account" className="mt-6 inline-block font-semibold text-accent underline">
          Your account
        </Link>
      </section>
    );
  if (!user || !profile || status !== 'ready') return null;
  return <ProfileForm key={user.uid} uid={user.uid} profile={profile} />;
}

function ProfileForm({ uid, profile }: { uid: string; profile: UserProfile }) {
  const [base, setBase] = useState(profile);
  const [name, setName] = useState(profile.displayName);
  const [budgets, setBudgets] = useState(
    () =>
      Object.fromEntries(
        WEEKDAYS.map(({ key }) => [key, String(profile.studyBudgetMinutes[key])]),
      ) as Record<number, string>,
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const hasRemoteChanges =
    profile.updatedAt.seconds > base.updatedAt.seconds ||
    (profile.updatedAt.seconds === base.updatedAt.seconds &&
      profile.updatedAt.nanoseconds > base.updatedAt.nanoseconds);
  const dirty =
    name !== base.displayName ||
    WEEKDAYS.some(({ key }) => budgets[key] !== String(base.studyBudgetMinutes[key]));

  function loadLatest() {
    setBase(profile);
    setName(profile.displayName);
    setBudgets(
      Object.fromEntries(WEEKDAYS.map(({ key }) => [key, String(profile.studyBudgetMinutes[key])])),
    );
    setFields({});
    setError(null);
    setSaved(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || hasRemoteChanges) return;
    const invalid: Record<string, string> = {};
    if (!name.trim() || name.trim().length > 80)
      invalid['settings-name'] = 'Enter a name between 1 and 80 characters.';
    const numbers: Record<number, number> = {};
    for (const { key, label } of WEEKDAYS) {
      const raw = budgets[key] ?? '';
      const value = Number(raw);
      if (!/^\d+$/.test(raw) || !Number.isInteger(value) || value < 0 || value > 1440)
        invalid[`budget-${key}`] = `${label} must be a whole number from 0 to 1440 minutes.`;
      numbers[key] = value;
    }
    setFields(invalid);
    setError(null);
    setSaved(false);
    const first = Object.keys(invalid)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    locked.current = true;
    setBusy(true);
    try {
      const input = validateProfileInput({
        displayName: name,
        studyBudgetMinutes: numbers as StudyBudgetMinutes,
      });
      const confirmed = await saveProfile(uid, input, base.updatedAt);
      if (!active.current) return;
      setBase(confirmed);
      setName(confirmed.displayName);
      setBudgets(
        Object.fromEntries(
          WEEKDAYS.map(({ key }) => [key, String(confirmed.studyBudgetMinutes[key])]),
        ),
      );
      setSaved(true);
    } catch (reason) {
      if (active.current) setError(accountErrorMessage(reason));
    } finally {
      locked.current = false;
      if (active.current) setBusy(false);
    }
  }

  return (
    <section className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        Make a little room
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Profile and study budgets
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">
        Choose how much time you want to set aside each day. A budget is your plan, not a record of
        time already studied.
      </p>
      <form
        noValidate
        onSubmit={(event) => {
          void submit(event);
        }}
        aria-busy={busy}
        className="mt-7 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {saved && !dirty && (
          <p role="status" className="rounded-xl bg-teal-50 p-4 text-sm font-medium text-accent">
            Profile and study budgets saved.
          </p>
        )}
        {hasRemoteChanges && (
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            <p role="alert">
              Your profile changed in another session.{' '}
              {dirty ? 'Your unsaved entries are still here. ' : ''}Reload the latest profile before
              saving.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={loadLatest}
              className="mt-3 font-semibold underline"
            >
              Reload latest profile
            </button>
          </div>
        )}
        <FormField
          id="settings-name"
          label="Display name"
          autoComplete="nickname"
          maxLength={80}
          required
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
          error={fields['settings-name']}
          disabled={busy}
        />
        <div>
          <p className="text-sm font-semibold text-ink">Timezone</p>
          <p className="mt-2 text-sm text-slate-600">Africa/Johannesburg (SAST, UTC+02:00)</p>
        </div>
        <fieldset disabled={busy}>
          <legend className="font-semibold text-ink">Daily study budgets</legend>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Minutes per day, from 0 to 1440. Set 0 for a day when you do not plan to study.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {WEEKDAYS.map(({ key, label }) => (
              <FormField
                key={key}
                id={`budget-${key}`}
                label={`${label} (minutes)`}
                type="number"
                inputMode="numeric"
                min={0}
                max={1440}
                step={1}
                required
                value={budgets[key] ?? ''}
                onChange={(event) => {
                  setBudgets((values) => ({ ...values, [key]: event.target.value }));
                  setSaved(false);
                }}
                error={fields[`budget-${key}`]}
              />
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center gap-4">
          <button
            disabled={busy || !dirty || hasRemoteChanges}
            type="submit"
            className="min-h-11 rounded-xl bg-ink px-6 py-3 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save profile'}
          </button>
          <button
            disabled={busy || !dirty}
            type="button"
            onClick={loadLatest}
            className="min-h-11 font-semibold text-accent underline"
          >
            Discard changes
          </button>
          {dirty && <span className="text-sm text-slate-500">Unsaved changes</span>}
        </div>
      </form>
    </section>
  );
}
