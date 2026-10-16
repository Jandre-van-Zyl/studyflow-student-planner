import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { readFirebaseConfiguration } from '@/lib/firebase/config';
import { AuthContext, type AuthContextValue, type SessionState } from './authContext';
import {
  registerAccount,
  signInAccount,
  signOutAccount,
  watchCurrentUser,
  type SessionUser,
} from './authService';
import { accountErrorMessage } from './errors';
import { ensureProfile, watchProfile } from './profileService';
import { defaultDisplayName, validateDisplayName } from './profileValidation';

const cleared = { user: null, profile: null, error: null };
const PROFILE_TIMEOUT_MS = 15_000;

function configuration(): { mode: AuthContextValue['mode']; state: SessionState } {
  try {
    const { mode } = readFirebaseConfiguration(import.meta.env);
    return { mode, state: { ...cleared, status: mode === 'disabled' ? 'disabled' : 'loading' } };
  } catch {
    return {
      mode: 'invalid',
      state: {
        ...cleared,
        status: 'error',
        error: 'Account access is not configured correctly. Contact the project owner.',
      },
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(configuration);
  const [state, setState] = useState(initial.state);
  const [setupDisplayName, setSetupDisplayName] = useState('');
  const current = useRef<SessionUser | null>(null);
  const generation = useRef(0);
  const stopProfile = useRef<() => void>(() => {});
  const mounted = useRef(false);
  const endingSession = useRef(false);
  const registration = useRef<{ email: string; name: string } | null>(null);
  const profileName = useRef<{ uid: string; name: string } | null>(null);

  const loadProfile = useCallback((user: SessionUser, requestedName?: string) => {
    stopProfile.current();
    const attempt = ++generation.current;
    const name =
      requestedName ??
      (profileName.current?.uid === user.uid
        ? profileName.current.name
        : defaultDisplayName(user.email));
    profileName.current = { uid: user.uid, name };
    setSetupDisplayName(name);
    const valid = () =>
      mounted.current &&
      !endingSession.current &&
      generation.current === attempt &&
      current.current?.uid === user.uid;
    let stop: (() => void) | undefined;
    let stopped = false;
    let creating = false;
    const timer = setTimeout(
      () => fail('Your profile could not be reached. Check the connection, then retry.'),
      PROFILE_TIMEOUT_MS,
    );
    const cleanup = () => {
      stopped = true;
      clearTimeout(timer);
      stop?.();
    };
    stopProfile.current = cleanup;
    const fail = (message: string) => {
      if (!valid() || stopped) return;
      cleanup();
      setState({ status: 'profile-error', user, profile: null, error: message });
    };
    setState({ status: 'profile-loading', user, profile: null, error: null });
    try {
      stop = watchProfile(
        user.uid,
        (profile) => {
          if (!valid() || stopped) return;
          if (profile) {
            clearTimeout(timer);
            setState({ status: 'ready', user, profile, error: null });
          } else if (!creating) {
            creating = true;
            void ensureProfile(user.uid, name).catch((error: unknown) =>
              fail(accountErrorMessage(error)),
            );
          }
        },
        (error) => fail(accountErrorMessage(error)),
      );
      if (stopped) stop();
    } catch (error) {
      fail(accountErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    if (initial.mode === 'disabled' || initial.mode === 'invalid')
      return () => {
        mounted.current = false;
      };
    const stop = watchCurrentUser(
      (user) => {
        if (!active || !mounted.current || endingSession.current) return;
        current.current = user;
        ++generation.current;
        stopProfile.current();
        if (!user) {
          profileName.current = null;
          setSetupDisplayName('');
          setState({ ...cleared, status: 'signed-out' });
          return;
        }
        const pending = registration.current;
        const name =
          pending && pending.email === user.email?.toLowerCase() ? pending.name : undefined;
        registration.current = null;
        loadProfile(user, name);
      },
      (error) => {
        if (!active || !mounted.current) return;
        current.current = null;
        profileName.current = null;
        setSetupDisplayName('');
        ++generation.current;
        stopProfile.current();
        setState({ ...cleared, status: 'error', error: accountErrorMessage(error) });
      },
    );
    return () => {
      active = false;
      mounted.current = false;
      stop();
      stopProfile.current();
    };
  }, [initial.mode, loadProfile]);

  const value: AuthContextValue = {
    ...state,
    mode: initial.mode,
    setupDisplayName,
    register: async (name, email, password) => {
      const displayName = validateDisplayName(name);
      registration.current = { name: displayName, email: email.trim().toLowerCase() };
      try {
        await registerAccount(email, password);
      } catch (error) {
        registration.current = null;
        throw error;
      }
    },
    signIn: signInAccount,
    signOut: async () => {
      endingSession.current = true;
      current.current = null;
      registration.current = null;
      profileName.current = null;
      setSetupDisplayName('');
      ++generation.current;
      stopProfile.current();
      setState({ ...cleared, status: 'loading' });
      try {
        await signOutAccount();
        if (mounted.current) setState({ ...cleared, status: 'signed-out' });
      } catch (error) {
        if (mounted.current)
          setState({ ...cleared, status: 'error', error: accountErrorMessage(error) });
        throw error;
      } finally {
        endingSession.current = false;
      }
    },
    retryProfile: (name) => {
      const user = current.current;
      if (user) loadProfile(user, name ? validateDisplayName(name) : undefined);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
