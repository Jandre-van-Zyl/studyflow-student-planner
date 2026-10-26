type CodeRef = { id: string; code: string };

export const SUBJECT_FORMAT_ERROR =
  'Enter a subject name (1–80 characters) and code (1–20 characters).';
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
  if (!name || name.length > 80 || !code || code.length > 20) return SUBJECT_FORMAT_ERROR;
  if (subjects.some((s) => s.id !== id && s.code.toUpperCase() === code)) {
    return SUBJECT_DUPLICATE_ERROR;
  }
  return '';
}

/** Times are "HH:MM" and dates "YYYY-MM-DD", so string comparison is safe. */
export function validateClassSlot(
  subjectId: string,
  start: string,
  end: string,
  from: string,
  to: string,
): string {
  if (!subjectId || end <= start || to < from) return CLASS_FORM_ERROR;
  return '';
}