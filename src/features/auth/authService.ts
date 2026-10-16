import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirebaseServices } from '@/lib/firebase/client';

export type SessionUser = Pick<User, 'uid' | 'email'>;
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
          stop = onAuthStateChanged(
            auth,
            (user) => {
              if (active) next(user ? { uid: user.uid, email: user.email } : null);
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
