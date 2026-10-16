import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { profileFixture } from '@/test/accountFixtures';
import {
  defaultDisplayName,
  defaultStudyBudgets,
  parseUserProfile,
  validateDisplayName,
  validateProfileInput,
} from './profileValidation';

describe('profile contract', () => {
  it('provides independent zero-budget maps with every ISO weekday', () => {
    const first = defaultStudyBudgets();
    first[1] = 100;
    expect(defaultStudyBudgets()).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 });
  });
  it('trims names and accepts inclusive budget boundaries', () => {
    const input = validateProfileInput({
      displayName: ' Student ',
      studyBudgetMinutes: { ...defaultStudyBudgets(), 1: 1440 },
    });
    expect(input.displayName).toBe('Student');
    expect(input.studyBudgetMinutes[1]).toBe(1440);
  });
  it.each([-1, 0.5, 1441, NaN, Infinity, '30'])('rejects an invalid budget %s', (value) => {
    const input = {
      displayName: 'Student',
      studyBudgetMinutes: { ...defaultStudyBudgets(), 2: value },
    };
    expect(() => validateProfileInput(input as Parameters<typeof validateProfileInput>[0])).toThrow(
      'Tuesday',
    );
  });
  it.each([{}, { 1: 0 }, { ...defaultStudyBudgets(), 8: 0 }, null, []])(
    'rejects an incomplete/extra-key map',
    (budgets) => {
      expect(() =>
        validateProfileInput({
          displayName: 'A',
          studyBudgetMinutes: budgets as ReturnType<typeof defaultStudyBudgets>,
        }),
      ).toThrow('seven');
    },
  );
  it.each(['', '  ', 'a'.repeat(81), 'a\nb', 'a\rb', 'a\u2028b', 'a\u2029b'])(
    'rejects invalid display names',
    (name) => {
      expect(() => validateDisplayName(name)).toThrow();
    },
  );
  it('parses valid profiles and rejects untrusted persisted fields/timestamps/timezones', () => {
    expect(parseUserProfile(profileFixture())).toEqual(profileFixture());
    for (const data of [
      null,
      { ...profileFixture(), role: 'admin' },
      { ...profileFixture(), timezone: 'UTC' },
      { ...profileFixture(), displayName: ' A ' },
      { ...profileFixture(), createdAt: null },
      { ...profileFixture(), updatedAt: new Timestamp(0, 0) },
      { ...profileFixture(), studyBudgetMinutes: {} },
    ])
      expect(() => parseUserProfile(data)).toThrow();
  });
  it('supplies a bounded recovery name without depending on an auth displayName', () => {
    expect(defaultDisplayName('student@example.test')).toBe('student');
    expect(defaultDisplayName(null)).toBe('Student');
    expect(defaultDisplayName('x'.repeat(100) + '@example.test')).toHaveLength(80);
  });
});
