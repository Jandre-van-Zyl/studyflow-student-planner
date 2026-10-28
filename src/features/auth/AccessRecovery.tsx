import { useEffect, useRef, useState } from 'react';
import { useAuth } from './authContext';
import { accountErrorMessage } from './errors';

export function AccessRecovery() {
  const auth = useAuth();
  const verification = auth.status === 'verification-required';
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const locked = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(false), 60_000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function perform(action: 'send' | 'check' | 'out') {
    if (locked.current || (action === 'send' && cooldown)) return;
    locked.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (action === 'send') {
        await auth.sendVerification();
        if (mounted.current) {
          setMessage('Verification email sent. Open its link, then return here and check again.');
          setCooldown(true);
        }
      } else if (action === 'check') {
        await auth.recheckAccess();
        if (mounted.current)
          setMessage(
            'Access checked. If this screen remains, verification or approval is still needed.',
          );
      } else await auth.signOut();
    } catch (reason) {
      if (mounted.current) setError(accountErrorMessage(reason));
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section className="max-w-[560px] border-y border-line py-8" aria-busy={busy}>
      <h1>
        {verification
          ? 'Verify your student email'
          : auth.status === 'membership-error'
            ? 'Student access unavailable'
            : 'Student approval needed'}
      </h1>
      <p className="mt-4 leading-7">
        {verification
          ? 'Verify the address you registered before opening your private planner.'
          : 'Your verified email must be on the team-approved student list. Ask the project owner to confirm your exact address.'}
      </p>
      <p className="mt-3 break-all text-muted">{auth.user?.email}</p>
      {verification && (
        <ol className="mt-5 list-decimal space-y-3 rounded-lg border border-line bg-white py-5 pr-5 pl-10 text-sm">
          <li>
            Click <strong>Send verification email</strong> below.
          </li>
          <li>
            Open the StudyFlow email and follow its verification link. Check Junk or Spam if it is
            missing.
          </li>
          <li>
            Return to this tab and click <strong>Check access again</strong>.
          </li>
        </ol>
      )}
      {auth.mode === 'emulator' && (
        <p className="notice notice-warning mt-4">
          Local demo · Verification links appear in the emulator terminal. Approval must be added to
          the local emulator; it does not affect cloud accounts.
        </p>
      )}
      {auth.error && (
        <p role="alert" className="notice notice-error mt-4">
          {auth.error}
        </p>
      )}
      {error && (
        <p role="alert" className="notice notice-error mt-4">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="notice mt-4">
          {message}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {verification && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || cooldown}
            onClick={() => {
              void perform('send');
            }}
          >
            {cooldown ? 'Wait 60 seconds to resend' : 'Send verification email'}
          </button>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy}
          onClick={() => {
            void perform('check');
          }}
        >
          Check access again
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy}
          onClick={() => {
            void perform('out');
          }}
        >
          Sign out
        </button>
      </div>
    </section>
  );
}
