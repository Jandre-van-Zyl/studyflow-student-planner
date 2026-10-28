import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { readFirebaseConfiguration } from '@/lib/firebase/config';
import { AuthContext, type AuthContextValue, type SessionState } from './authContext';
import {
  registerAccount,
  signInAccount,
  signOutAccount,
  watchCurrentUser,
  refreshAccount,
  sendVerificationEmail,
  type SessionUser,
} from './authService';
import { accountErrorMessage } from './errors';
import { ensureProfile, watchProfile } from './profileService';
import { defaultDisplayName, validateDisplayName } from './profileValidation';
import { watchMembership } from './membershipService';

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
  const stopMembership = useRef<() => void>(() => {});
  const accessGeneration = useRef(0);
  const approvedUid = useRef<string | null>(null);
  const mounted = useRef(false);
  const endingSession = useRef(false);
  const registration = useRef<{ email: string; name: string } | null>(null);
  const profileName = useRef<{ uid: string; name: string } | null>(null);

  const loadProfile = useCallback((user: SessionUser, requestedName?: string) => {
    if (!user.emailVerified || approvedUid.current !== user.uid) return;
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
      approvedUid.current === user.uid &&
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

  const openSession = useCallback(
    (user: SessionUser | null) => {
      current.current = user;
      approvedUid.current = null;
      ++generation.current;
      const attempt = ++accessGeneration.current;
      stopProfile.current();
      stopMembership.current();
      if (!user) {
        profileName.current = null;
        registration.current = null;
        setSetupDisplayName('');
        setState({ ...cleared, status: 'signed-out' });
        return;
      }
      const pending = registration.current;
      if (pending && pending.email === user.email?.toLowerCase()) {
        profileName.current = { uid: user.uid, name: pending.name };
        registration.current = null;
      } else if (profileName.current?.uid !== user.uid) profileName.current = null;
      setSetupDisplayName(profileName.current?.name ?? defaultDisplayName(user.email));
      if (!user.emailVerified) {
        setState({ status: 'verification-required', user, profile: null, error: null });
        return;
      }
      const valid = () =>
        mounted.current &&
        !endingSession.current &&
        accessGeneration.current === attempt &&
        current.current?.uid === user.uid;
      let stop: (() => void) | undefined;
      let stopped = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const cleanup = () => {
        stopped = true;
        clearTimeout(timer);
        stop?.();
      };
      stopMembership.current = cleanup;
      const lock = (
        status: 'membership-loading' | 'membership-denied' | 'membership-error',
        error: string | null = null,
      ) => {
        approvedUid.current = null;
        ++generation.current;
        stopProfile.current();
        setState({ status, user, profile: null, error });
      };
      const fail = (error: unknown) => {
        if (!valid() || stopped) return;
        cleanup();
        lock('membership-error', accountErrorMessage(error));
      };
      lock('membership-loading');
      timer = setTimeout(() => fail({ code: 'deadline-exceeded' }), PROFILE_TIMEOUT_MS);
      try {
        stop = watchMembership(
          user,
          (membership) => {
            if (!valid() || stopped) return;
            if (membership === 'checking') {
              lock('membership-loading');
              timer ??= setTimeout(() => fail({ code: 'deadline-exceeded' }), PROFILE_TIMEOUT_MS);
              return;
            }
            clearTimeout(timer);
            timer = undefined;
            if (membership === 'approved') {
              if (approvedUid.current !== user.uid) {
                approvedUid.current = user.uid;
                loadProfile(user);
              }
            } else lock('membership-denied');
          },
          fail,
        );
        if (stopped) stop();
      } catch (error) {
        fail(error);
      }
    },
    [loadProfile],
  );

  useEffect(() => {
    mounted.current = true;
    // The ref object is stable for this effect; invalidate its latest generation on cleanup.
    const accessVersion = accessGeneration;
    let active = true;
    if (initial.mode === 'disabled' || initial.mode === 'invalid')
      return () => {
        mounted.current = false;
      };
    const stop = watchCurrentUser(
      (user) => {
        if (!active || !mounted.current || endingSession.current) return;
        // Routine token renewal must not discard an admitted student's feature drafts.
        const previous = current.current;
        if (
          user &&
          previous &&
          user.uid === previous.uid &&
          user.email === previous.email &&
          user.emailVerified === previous.emailVerified
        )
          return;
        openSession(user);
      },
      (error) => {
        if (!active || !mounted.current) return;
        current.current = null;
        profileName.current = null;
        setSetupDisplayName('');
        ++generation.current;
        ++accessGeneration.current;
        approvedUid.current = null;
        stopMembership.current();
        stopProfile.current();
        setState({ ...cleared, status: 'error', error: accountErrorMessage(error) });
      },
    );
    return () => {
      active = false;
      mounted.current = false;
      stop();
      stopProfile.current();
      stopMembership.current();
      ++accessVersion.current;
    };
  }, [initial.mode, openSession]);

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
      ++accessGeneration.current;
      approvedUid.current = null;
      stopMembership.current();
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
    sendVerification: sendVerificationEmail,
    recheckAccess: async () => {
      const attempt = accessGeneration.current;
      const refreshed = await refreshAccount();
      if (mounted.current && !endingSession.current && accessGeneration.current === attempt)
        openSession(refreshed);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
