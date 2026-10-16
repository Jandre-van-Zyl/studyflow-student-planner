import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type { StudyBudgetMinutes } from '@/shared/types/planner';
import type { PlannerKind } from '@/shared/types/planner';
import type { PlannerViewRecord } from './plannerContract';
import type { PlanningView } from './planningView';

export interface PreviewContextValue {
  data: PlanningView;
  saveRecord: <K extends PlannerKind>(kind: K, item: PlannerViewRecord<K>) => Promise<void>;
  preview: boolean;
  available: boolean;
  day: string;
  setDay: Dispatch<SetStateAction<string>>;
  budgets: StudyBudgetMinutes;
}
export const PreviewContext = createContext<PreviewContextValue | null>(null);
export function usePlanningPreview() {
  const value = useContext(PreviewContext);
  if (!value) throw new Error('Planning preview must be inside the authenticated workspace.');
  return value;
}
