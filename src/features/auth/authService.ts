import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  reload,
  getIdToken,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirebaseServices } from '@/lib/firebase/client';

export type SessionUser = Pick<User, 'uid' | 'email' | 'emailVerified'>;
const sessionUser = (user: User): SessionUser => ({
  uid: user.uid,
  email: user.email,
  emailVerified: user.emailVerified,
});
let persistence: Promise<void> | undefined;

function preparedAuth() {
  const auth = getFirebaseServices().auth;
  persistence ??= setPersistence(auth, browserSessionPersistence).catch((error: unknown) => {
    persistence = undefined;
    throw error;
  });
  return { auth, ready: persistence };
}

export function watchCurrentUser(
  next: (user: SessionUser | null) => void,
  fail: (error: unknown) => void,
): () => void {
  let active = true;
  let stop: (() => void) | undefined;
  try {
    const { auth, ready } = preparedAuth();
    void ready
      .then(() => {
        if (active)
          stop = onIdTokenChanged(
            auth,
            (user) => {
              if (active) next(user ? sessionUser(user) : null);
            },
            (error) => {
              if (active) fail(error);
            },
          );
      })
      .catch((error: unknown) => {
        if (active) fail(error);
      });
  } catch (error) {
    queueMicrotask(() => {
      if (active) fail(error);
    });
  }
  return () => {
    active = false;
    stop?.();
  };
}

export async function registerAccount(email: string, password: string): Promise<void> {
  const { auth, ready } = preparedAuth();
  await ready;
  await createUserWithEmailAndPassword(auth, email.trim(), password);
}

export async function signInAccount(email: string, password: string): Promise<void> {
  const { auth, ready } = preparedAuth();
  await ready;
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signOutAccount(): Promise<void> {
  await signOut(getFirebaseServices().auth);
}

export async function refreshAccount(): Promise<SessionUser | null> {
  const auth = getFirebaseServices().auth;
  const user = auth.currentUser;
  if (!user) return null;
  await reload(user);
  if (auth.currentUser !== user) return null;
  await getIdToken(user, true);
  return auth.currentUser === user ? sessionUser(user) : null;
}

export async function sendVerificationEmail(): Promise<void> {
  const user = getFirebaseServices().auth.currentUser;
  if (!user) throw { code: 'auth/user-token-expired' };
  if (!user.emailVerified) await sendEmailVerification(user);
}
