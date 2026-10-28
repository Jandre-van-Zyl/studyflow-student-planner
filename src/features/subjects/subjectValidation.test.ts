import { describe, expect, it } from 'vitest';
import { validateClassSlot, validateSubject, SUBJECT_DUPLICATE_ERROR } from './subjectValidation';

describe('subject and class form validation', () => {
  it('normalizes codes and retains uniqueness for archived subjects', () => {
    expect(
      validateSubject('Software Engineering', ' se2 ', 'new', [{ id: 'old', code: 'SE2' }]),
    ).toBe(SUBJECT_DUPLICATE_ERROR);
    expect(
      validateSubject('Software Engineering', ' se2 ', 'old', [{ id: 'old', code: 'SE2' }]),
    ).toBe('');
  });
  it.each(['', 'SE 2', 'SE/2', '-SE2', '_SE2', 'A'.repeat(21)])(
    'rejects invalid subject code %s before saving',
    (code) => {
      expect(validateSubject('Subject', code, 'new', [])).not.toBe('');
    },
  );
  it('rejects invalid calendar dates and malformed times', () => {
    expect(validateClassSlot('se2', '09:00', '10:00', '2026-02-30', '2026-03-01')).not.toBe('');
    expect(validateClassSlot('se2', '09:00', '25:00', '2026-10-28', '2026-10-29')).not.toBe('');
    expect(validateClassSlot('se2', '', '10:00', '2026-10-28', '2026-10-29')).not.toBe('');
  });
  it('permits valid same-day active boundaries and rejects reversed intervals', () => {
    expect(validateClassSlot('se2', '09:00', '10:00', '2026-10-28', '2026-10-28')).toBe('');
    expect(validateClassSlot('se2', '10:00', '09:00', '2026-10-28', '2026-10-28')).not.toBe('');
  });
});
