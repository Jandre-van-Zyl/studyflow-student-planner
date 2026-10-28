import { validPlannerDay } from '@/features/planner/plannerContract';

type CodeRef = { id: string; code: string };

export const SUBJECT_FORMAT_ERROR =
  'Enter a name (1–80 characters) and a code (1–20 letters, digits, hyphens or underscores), starting with a letter or digit.';
export const SUBJECT_DUPLICATE_ERROR =
  'That subject code already exists, including archived subjects. Edit or restore it instead.';
export const CLASS_FORM_ERROR =
  'Choose a subject, an end time after the start and an active end date on or after the start date.';

/** Returns an error message, or '' when the input is valid. */
export function validateSubject(
  rawName: string,
  rawCode: string,
  id: string,
  subjects: CodeRef[],
): string {
  const name = rawName.trim();
  const code = rawCode.trim().toUpperCase();
  if (
    !name ||
    name.length > 80 ||
    /[\r\n\u2028\u2029]/.test(name) ||
    !/^[A-Z0-9][A-Z0-9_-]{0,19}$/.test(code)
  )
    return SUBJECT_FORMAT_ERROR;
  if (subjects.some((s) => s.id !== id && s.code.toUpperCase() === code)) {
    return SUBJECT_DUPLICATE_ERROR;
  }
  return '';
}

/** Validate canonical dates/times before comparing their sortable strings. */
export function validateClassSlot(
  subjectId: string,
  start: string,
  end: string,
  from: string,
  to: string,
): string {
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (
    !subjectId ||
    !time.test(start) ||
    !time.test(end) ||
    !validPlannerDay(from) ||
    !validPlannerDay(to) ||
    end <= start ||
    to < from
  )
    return CLASS_FORM_ERROR;
  return '';
}
