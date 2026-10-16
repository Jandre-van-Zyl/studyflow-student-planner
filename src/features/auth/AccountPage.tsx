import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { FormField } from '@/shared/components/FormField';
import { useAuth } from './authContext';
import { accountErrorMessage } from './errors';
import { validateDisplayName } from './profileValidation';

export function AccountPage() {
  const auth = useAuth();
  const location = useLocation();
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const locked = useRef(false);
  const from: unknown = (location.state as { from?: unknown } | null)?.from;
  const destination =
    typeof from === 'string' &&
    /^\/(dashboard|subjects|assessments|planner|settings)(\?.*)?$/.test(from)
      ? from
      : '/dashboard';

  if (auth.status === 'disabled')
    return (
      <section className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-semibold text-ink">Your account</h1>
        <p className="mt-4 leading-7">
          Accounts are unavailable in this preview. You can still explore the planner layout.
        </p>
        <Link to="/dashboard" className="mt-6 inline-block font-semibold text-accent underline">
          Explore the workspace
        </Link>
      </section>
    );
  if (auth.status === 'loading' || auth.status === 'profile-loading')
    return (
      <section className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-semibold text-ink">Opening your account</h1>
        <p role="status" className="mt-4">
          {auth.status === 'profile-loading'
            ? 'Loading your private profile…'
            : 'Checking your session…'}
        </p>
      </section>
    );
  if (auth.status === 'profile-error')
    return <ProfileRecovery onReady={() => setSubmitted(true)} />;
  if (auth.status === 'error')
    return (
      <section className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-semibold text-ink">Account unavailable</h1>
        <p role="alert" className="mt-4 text-red-700">
          {auth.error}
        </p>
        <p className="mt-3 text-sm leading-6">
          Your workspace is locked while the session is unavailable.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-ink px-5 py-3 font-semibold text-white"
        >
          Reload account
        </button>
        {auth.mode !== 'invalid' && (
          <button
            type="button"
            onClick={() => {
              void auth.signOut().catch(() => {});
            }}
            className="ml-3 mt-3 rounded-xl border border-slate-300 px-5 py-3 font-semibold"
          >
            Retry sign out
          </button>
        )}
      </section>
    );
  if (auth.status === 'ready' && auth.user && auth.profile) {
    if (submitted || from) return <Navigate to={destination} replace />;
    return (
      <section className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Your private account
        </p>
        <h1 className="mt-3 break-words text-3xl font-semibold text-ink">
          Welcome, {auth.profile.displayName}
        </h1>
        <p className="mt-3 break-all text-slate-600">{auth.user.email}</p>
        <p className="mt-4 text-sm leading-6">
          Your profile and study budgets belong to your account. Times use Africa/Johannesburg.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/settings" className="rounded-xl bg-ink px-5 py-3 font-semibold text-white">
            Edit profile and budgets
          </Link>
          <Link
            to="/dashboard"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-ink"
          >
            Open dashboard
          </Link>
        </div>
        <button
          type="button"
          onClick={() => {
            void auth.signOut().catch(() => {});
          }}
          className="mt-6 font-semibold text-accent underline"
        >
          Sign out
        </button>
      </section>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const invalid: Record<string, string> = {};
    if (registering) {
      try {
        validateDisplayName(name);
      } catch (reason) {
        invalid['account-name'] = accountErrorMessage(reason);
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      invalid['account-email'] = 'Enter a valid email address.';
    if (!password) invalid['account-password'] = 'Enter your password.';
    else if (registering && (password.length < 8 || password.length > 128))
      invalid['account-password'] = 'Use between 8 and 128 characters.';
    if (registering && confirmation !== password)
      invalid['account-confirm'] = 'The passwords do not match.';
    setFields(invalid);
    setError(null);
    const first = Object.keys(invalid)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    locked.current = true;
    setBusy(true);
    setSubmitted(true);
    try {
      if (registering) await auth.register(name, email, password);
      else await auth.signIn(email, password);
      setPassword('');
      setConfirmation('');
    } catch (reason) {
      setError(accountErrorMessage(reason));
      setSubmitted(false);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        A little clarity for your week
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {registering ? 'Create your account' : 'Sign in to StudyFlow'}
      </h1>
      <p className="mt-3 leading-7 text-slate-600">
        Your subjects, deadlines and study plans, in your own private workspace.
      </p>
      {auth.mode === 'emulator' && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Local demo · Use a test email and a password you do not use elsewhere.
        </p>
      )}
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        noValidate
        aria-busy={busy}
        className="mt-6 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {registering && (
          <FormField
            id="account-name"
            name="displayName"
            label="Display name"
            autoComplete="nickname"
            maxLength={80}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={fields['account-name']}
            disabled={busy}
          />
        )}
        <FormField
          id="account-email"
          name="email"
          label="Email address"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fields['account-email']}
          disabled={busy}
        />
        <FormField
          id="account-password"
          name="password"
          label="Password"
          type="password"
          autoComplete={registering ? 'new-password' : 'current-password'}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fields['account-password']}
          help={
            registering
              ? 'Use 8–128 characters. Do not reuse a password from another account.'
              : undefined
          }
          disabled={busy}
        />
        {registering && (
          <FormField
            id="account-confirm"
            name="confirmation"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            error={fields['account-confirm']}
            disabled={busy}
          />
        )}
        <button
          disabled={busy}
          type="submit"
          className="min-h-11 w-full rounded-xl bg-ink px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}
        </button>
        <p className="text-xs leading-5 text-slate-500">
          This tab remembers your session until you sign out or close it.
        </p>
      </form>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setRegistering(!registering);
          setFields({});
          setError(null);
          setPassword('');
          setConfirmation('');
        }}
        className="mt-6 min-h-11 font-semibold text-accent underline"
      >
        {registering ? 'Already have an account? Sign in' : 'New to StudyFlow? Create an account'}
      </button>
    </section>
  );
}

function ProfileRecovery({ onReady }: { onReady: () => void }) {
  const auth = useAuth();
  const [name, setName] = useState(auth.setupDisplayName);
  const [error, setError] = useState<string | null>(null);
  return (
    <section className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8">
      <h1 className="text-3xl font-semibold text-ink">Finish opening your profile</h1>
      <p className="mt-3 break-all text-sm">
        You are signed in as {auth.user?.email}. Your account exists; do not register again.
      </p>
      <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
        {auth.error}
      </p>
      <form
        className="mt-6 space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          try {
            validateDisplayName(name);
            onReady();
            auth.retryProfile(name);
          } catch (reason) {
            setError(accountErrorMessage(reason));
          }
        }}
      >
        <FormField
          id="recovery-name"
          label="Display name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={error ?? undefined}
          help="Used only if your profile has not yet been created. Existing profile data is preserved."
        />
        <button className="rounded-xl bg-ink px-5 py-3 font-semibold text-white" type="submit">
          Retry profile
        </button>
        <button
          className="ml-4 font-semibold text-accent underline"
          type="button"
          onClick={() => {
            void auth.signOut().catch(() => {});
          }}
        >
          Sign out
        </button>
      </form>
    </section>
  );
}
