import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/authContext';
import { saveProfile } from '@/features/auth/profileService';
import { accountErrorMessage } from '@/features/auth/errors';
import { WEEKDAYS } from '@/features/auth/profileValidation';
import type { StudyBudgetMinutes, UserProfile } from '@/shared/types/planner';

export function StudySetup() {
  const { user, profile } = useAuth();
  if (!user || !profile) return null;
  return <StudySetupForm key={user.uid} uid={user.uid} profile={profile} />;
}

function StudySetupForm({ uid, profile }: { uid: string; profile: UserProfile }) {
  const navigate = useNavigate();
  const [base, setBase] = useState(profile);
  const [step, setStep] = useState(0);
  const [budgets, setBudgets] = useState<StudyBudgetMinutes>({ ...profile.studyBudgetMinutes });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const active = useRef(true);
  const locked = useRef(false);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const total = Object.values(budgets).reduce((a, b) => a + b, 0);
  const selected = WEEKDAYS.filter(({ key }) => budgets[key] > 0);
  const hasRemoteChanges =
    profile.updatedAt.seconds > base.updatedAt.seconds ||
    (profile.updatedAt.seconds === base.updatedAt.seconds &&
      profile.updatedAt.nanoseconds > base.updatedAt.nanoseconds);
  function loadLatest() {
    setBase(profile);
    setBudgets({ ...profile.studyBudgetMinutes });
    setError('');
  }
  async function finish() {
    if (locked.current || hasRemoteChanges) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await saveProfile(
        uid,
        { displayName: base.displayName, studyBudgetMinutes: budgets },
        base.updatedAt,
      );
      if (active.current) navigate('/dashboard', { replace: true });
    } catch (failure) {
      if (active.current) setError(accountErrorMessage(failure));
    } finally {
      locked.current = false;
      if (active.current) setBusy(false);
    }
  }
  return (
    <section className="mx-auto max-w-[640px]">
      <p className="text-sm text-muted">Your study routine · Step {step + 1} of 3</p>
      <div className="mt-3 flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((n) => (
          <span
            key={n}
            className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-accent' : 'bg-line'}`}
          />
        ))}
      </div>
      <div key={step} className="setup-enter mt-8">
        <h1 ref={heading} tabIndex={-1} className="focus:outline-none">
          {step === 0
            ? 'When does studying fit your week?'
            : step === 1
              ? 'Make room at your own pace'
              : 'A week that works for you'}
        </h1>
        <p className="mt-3 text-muted">
          {step === 0
            ? 'Choose the days you usually have time outside class. Start small; you can change this anytime.'
            : step === 1
              ? 'How many minutes can you realistically spend on each day? This is available study time, not a class timetable.'
              : 'These daily budgets will appear in Settings and your weekly planner. Connect CTU next when you are ready.'}
        </p>
        {step === 0 && (
          <fieldset className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <legend className="sr-only">Study days</legend>
            {WEEKDAYS.map(({ key, label }) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 ${budgets[key] > 0 ? 'border-accent bg-accent-soft' : 'border-control bg-white'}`}
              >
                <input
                  className="h-5 min-h-0 w-5"
                  type="checkbox"
                  checked={budgets[key] > 0}
                  onChange={(event) =>
                    setBudgets({ ...budgets, [key]: event.target.checked ? 60 : 0 })
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>
        )}
        {step === 1 && (
          <div className="mt-6 space-y-4">
            {selected.map(({ key, label }) => (
              <label key={key} className="grid grid-cols-[1fr_140px] items-center gap-4">
                {label}
                <select
                  value={budgets[key]}
                  onChange={(event) =>
                    setBudgets({ ...budgets, [key]: Number(event.target.value) })
                  }
                >
                  {[...new Set([15, 30, 45, 60, 90, 120, 180, 240, budgets[key]])]
                    .sort((a, b) => a - b)
                    .map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} minutes
                      </option>
                    ))}
                </select>
              </label>
            ))}
            {!selected.length && (
              <p>
                No regular study days selected. You can start with zero and adjust Settings later.
              </p>
            )}
          </div>
        )}
        {step === 2 && (
          <div className="mt-6 rounded-lg border border-line bg-white p-6">
            <p className="text-3xl font-semibold text-ink">
              {Math.floor(total / 60)}h {total % 60}m{' '}
              <span className="text-base font-normal text-muted">per week</span>
            </p>
            <dl className="mt-4 divide-y divide-line">
              {WEEKDAYS.map(({ key, label }) => (
                <div key={key} className="flex justify-between py-2">
                  <dt>{label}</dt>
                  <dd>{budgets[key] ? `${budgets[key]} min` : 'Rest / flexible'}</dd>
                </div>
              ))}
            </dl>
            <p className="help mt-4">
              A budget is a guide, not a commitment. Nothing is automatically scheduled.
            </p>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="notice mt-5">
          {error}
        </p>
      )}
      {hasRemoteChanges && (
        <div className="notice notice-warning feedback-enter mt-5">
          <p role="alert">
            Your profile changed in another session. Your choices are still here. Reload the latest
            routine before saving; this replaces your unsaved choices.
          </p>
          <button type="button" className="text-link mt-3" disabled={busy} onClick={loadLatest}>
            Reload latest routine
          </button>
        </div>
      )}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          className="btn btn-secondary"
          disabled={step === 0 || busy}
          onClick={() => setStep(step - 1)}
        >
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={busy || (step === 2 && hasRemoteChanges)}
          onClick={() => (step < 2 ? setStep(step + 1) : void finish())}
        >
          {busy ? 'Saving your routine…' : step === 2 ? 'Save my routine' : 'Continue'}
        </button>
      </div>
      <p className="help mt-4">Your routine stays private to your StudyFlow account.</p>
    </section>
  );
}
