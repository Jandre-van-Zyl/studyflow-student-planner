import { useEffect, useRef, useState } from 'react';
import type { PlannerKind } from '@/shared/types/planner';
import { usePlanningPreview } from './previewContext';
import { plannerErrorMessage, type PlannerViewRecord } from './plannerContract';

// One in-flight operation per mounted page. Late completion cannot affect a new page/UID.
export function usePlannerMutation() {
  const { saveRecord, preview } = usePlanningPreview();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false),
    active = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function run<K extends PlannerKind>(kind: K, item: PlannerViewRecord<K>) {
    if (locked.current || !active.current) return false;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await saveRecord(kind, item);
      return active.current;
    } catch (failure) {
      if (active.current) setError(plannerErrorMessage(failure));
      return false;
    } finally {
      locked.current = false;
      if (active.current) setBusy(false);
    }
  }
  return { run, busy, error, preview };
}
