import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type { StudyBudgetMinutes } from '@/shared/types/planner';
import type { PlanningView } from './planningView';

export interface PreviewContextValue {
  data: PlanningView;
  setData: Dispatch<SetStateAction<PlanningView>>;
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
