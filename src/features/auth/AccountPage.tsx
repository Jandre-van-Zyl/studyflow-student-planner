import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { FormField } from '@/shared/components/FormField';
import { useAuth } from './authContext';
import { accountErrorMessage } from './errors';
import { validateDisplayName } from './profileValidation';
import { AccessRecovery } from './AccessRecovery';

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
      <section className="max-w-[560px] border-y border-line py-8">
        <h1>Your account</h1>
        <p className="mt-4 leading-7">
          Accounts are unavailable in this preview. You can still explore the planner layout.
        </p>
        <Link to="/dashboard" className="mt-6 inline-block font-semibold text-accent underline">
          Explore the workspace
        </Link>
      </section>
    );
  if (
    auth.status === 'loading' ||
    auth.status === 'profile-loading' ||
    auth.status === 'membership-loading'
  )
    return (
      <section className="max-w-[560px] border-y border-line py-8">
        <h1>Opening your account</h1>
        <p role="status" className="mt-4">
          {auth.status === 'membership-loading'
            ? 'Checking approved student access…'
            : auth.status === 'profile-loading'
              ? 'Loading your private profile…'
              : 'Checking your session…'}
        </p>
      </section>
    );
  if (
    auth.status === 'verification-required' ||
    auth.status === 'membership-denied' ||
    auth.status === 'membership-error'
  )
    return <AccessRecovery key={auth.user?.uid + ':' + auth.user?.email} />;
  if (auth.status === 'profile-error')
    return <ProfileRecovery onReady={() => setSubmitted(true)} />;
  if (auth.status === 'error')
    return (
      <section className="max-w-[560px] border-y border-line py-8">
        <h1>Account unavailable</h1>
        <p role="alert" className="mt-4 text-danger">
          {auth.error}
        </p>
        <p className="mt-3 text-sm leading-6">
          Your workspace is locked while the session is unavailable.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-primary mt-6"
        >
          Reload account
        </button>
        {auth.mode !== 'invalid' && (
          <button
            type="button"
            onClick={() => {
              void auth.signOut().catch(() => {});
            }}
            className="btn btn-secondary"
          >
            Retry sign out
          </button>
        )}
      </section>
    );
  if (auth.status === 'ready' && auth.user && auth.profile) {
    if (submitted || from) return <Navigate to={destination} replace />;
    return (
      <section className="max-w-[560px] border-y border-line py-8">
        <h1>Welcome, {auth.profile.displayName}</h1>
        <p className="mt-3 break-all text-muted">{auth.user.email}</p>
        <p className="mt-4 text-sm leading-6">
          Your profile and study budgets belong to your account. Times use Africa/Johannesburg.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/settings" className="btn btn-primary">
            Edit profile and budgets
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            Open dashboard
          </Link>
        </div>
        <button
          type="button"
          onClick={() => {
            void auth.signOut().catch(() => {});
          }}
          className="text-link mt-6"
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
      <h1>{registering ? 'Create your account' : 'Sign in to StudyFlow'}</h1>
      <p className="mt-3 leading-7 text-muted">
        Plan your CTU modules, deadlines and study time in one private workspace.
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">
        Use your team-approved student email. Verify it to open your planner.
      </p>
      {auth.mode === 'emulator' && (
        <p className="notice notice-warning mt-4">
          Local demo · Use a test email and a password you do not use elsewhere.
        </p>
      )}
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        noValidate
        aria-busy={busy}
        className="mt-6 space-y-5 rounded-lg border border-line bg-white p-6 sm:p-8"
      >
        {error && (
          <p role="alert" className="notice notice-error feedback-enter">
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
        <button disabled={busy} type="submit" className="btn btn-primary w-full">
          {busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}
        </button>
        <p className="text-xs leading-5 text-muted">
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
        className="text-link mt-6"
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
    <section className="max-w-[560px] border-y border-line py-8">
      <h1>Finish opening your profile</h1>
      <p className="mt-3 break-all text-sm">
        You are signed in as {auth.user?.email}. Your account exists; do not register again.
      </p>
      <p role="alert" className="mt-4 notice notice-error feedback-enter">
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
        <button className="btn btn-primary" type="submit">
          Retry profile
        </button>
        <button
          className="btn btn-quiet"
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
