import { useEffect, useState } from 'react';
import { watchStudySessions, type StudySession } from './studySessionService';
export function useStudySessions(uid?: string) {
  const [state, setState] = useState<{
    uid?: string;
    rows: StudySession[];
    ready: boolean;
    error: boolean;
  }>({ rows: [], ready: false, error: false });
  useEffect(() => {
    if (!uid) return;
    let live = true;
    const fail = () => {
      if (live) setState({ uid, rows: [], ready: false, error: true });
    };
    const timeout = setTimeout(fail, 15000);
    let stop = () => {};
    try {
      stop = watchStudySessions(
        uid,
        (rows) => {
          clearTimeout(timeout);
          if (live) setState({ uid, rows, ready: true, error: false });
        },
        fail,
      );
    } catch {
      fail();
    }
    return () => {
      live = false;
      clearTimeout(timeout);
      stop();
    };
  }, [uid]);
  return state.uid === uid ? state : { rows: [], ready: false, error: false };
}
