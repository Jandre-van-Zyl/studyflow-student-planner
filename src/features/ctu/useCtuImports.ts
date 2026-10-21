import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/authContext';
import { EMPTY_CTU, type CtuSavedView } from './ctuImportContract';
import { watchCtuImports } from './ctuImportService';

export function ctuSavingEnabled(mode: string) {
  return (
    mode === 'emulator' || (mode === 'cloud' && import.meta.env.VITE_CTU_SAVE_ENABLED === 'true')
  );
}
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
    const stop = watchCtuImports(
      uid,
      (data) => {
        if (active) setState({ uid, data, loading: false, error: '' });
      },
      () => {
        if (active)
          setState({
            uid,
            data: EMPTY_CTU,
            loading: false,
            error: 'Saved CTU information could not be loaded. Retry when connected.',
          });
      },
    );
    return () => {
      active = false;
      stop();
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
