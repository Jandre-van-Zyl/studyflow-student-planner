import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/authContext';
import { EMPTY_CTU, type CtuSavedView } from './ctuImportContract';
import { watchCtuImports } from './ctuImportService';

export function ctuSavingEnabled(mode: string) {
  return (
    mode === 'emulator' || (mode === 'cloud' && import.meta.env.VITE_CTU_SAVE_ENABLED === 'true')
  );
}
export const CTU_LOAD_TIMEOUT_MS = 15_000;

export function useCtuImports() {
  const { user, status, mode } = useAuth();
  const uid = status === 'ready' && ctuSavingEnabled(mode) ? (user?.uid ?? '') : '';
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{
    uid: string;
    data: CtuSavedView;
    loading: boolean;
    error: string;
  }>({ uid: '', data: EMPTY_CTU, loading: true, error: '' });
  useEffect(() => {
    if (!uid) return;
    let active = true;
    let stop: (() => void) | undefined;
    const fail = () => {
      if (!active) return;
      active = false;
      clearTimeout(timeout);
      stop?.();
      setState({
        uid,
        data: EMPTY_CTU,
        loading: false,
        error: 'Saved CTU information could not be loaded. Check your connection and retry.',
      });
    };
    const timeout = setTimeout(fail, CTU_LOAD_TIMEOUT_MS);
    try {
      stop = watchCtuImports(
        uid,
        (data) => {
          if (!active) return;
          clearTimeout(timeout);
          setState({ uid, data, loading: false, error: '' });
        },
        fail,
      );
      // A listener can fail synchronously during setup. Clean up its returned subscription too.
      if (!active) stop();
    } catch {
      fail();
    }
    return () => {
      active = false;
      clearTimeout(timeout);
      stop?.();
    };
  }, [uid, retry]);
  const active =
    uid && state.uid === uid ? state : { uid, data: EMPTY_CTU, loading: !!uid, error: '' };
  return {
    ...active,
    enabled: !!uid,
    retry: () => {
      setState({ uid, data: EMPTY_CTU, loading: true, error: '' });
      setRetry((n) => n + 1);
    },
  };
}
