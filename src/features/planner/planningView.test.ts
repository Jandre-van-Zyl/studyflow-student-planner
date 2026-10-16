import { describe, expect, it } from 'vitest';
import {
  EMPTY_VIEW,
  addDays,
  agendaForDay,
  allocation,
  blockConflicts,
  completion,
  exampleView,
  monday,
  rankedAssessments,
  sastDay,
  validateBlock,
  type ViewBlock,
} from './planningView';

describe('planning display calculations', () => {
  it('keeps empty and zero-budget data finite', () => {
    expect(completion(EMPTY_VIEW)).toEqual({ total: 0, done: 0, percent: 0, remaining: 0 });
    expect(allocation(EMPTY_VIEW, '2026-10-19')).toBe(0);
  });
  it('matches the published example without counting classes as study', () => {
    const data = exampleView();
    expect(allocation(data, '2026-10-19')).toBe(90);
    expect(completion(data)).toEqual({ total: 3, done: 1, percent: 33, remaining: 135 });
    expect(agendaForDay(data, '2026-10-19').map((e) => e.kind)).toEqual([
      'Study',
      'Class',
      'Study',
    ]);
  });
  it('uses SAST dates around UTC midnight and Monday-based weeks', () => {
    expect(sastDay(new Date('2026-10-18T22:01:00Z'))).toBe('2026-10-19');
    expect(monday('2026-10-25')).toBe('2026-10-19');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('retains done allocation, excludes cancelled blocks, and does not reduce estimates', () => {
    const data = exampleView();
    data.blocks[0]!.status = 'Done';
    data.blocks[1]!.status = 'Cancelled';
    expect(allocation(data, '2026-10-19')).toBe(45);
    expect(completion(data).remaining).toBe(135);
    expect(agendaForDay(data, '2026-10-19')).toHaveLength(2);
  });
  it('excludes archived/completed deadlines while retaining linked study history', () => {
    const data = exampleView();
    data.assessments[0]!.archived = true;
    expect(agendaForDay(data, '2026-10-20')).toHaveLength(0);
    expect(agendaForDay(data, '2026-10-19').some((e) => e.kind === 'Study')).toBe(true);
    expect(completion(data).total).toBe(2);
  });
  it('respects class active dates inclusively and hides archived subjects', () => {
    const data = exampleView();
    expect(agendaForDay(data, '2026-10-12').some((e) => e.kind === 'Class')).toBe(false);
    expect(agendaForDay(data, '2026-11-30').some((e) => e.kind === 'Class')).toBe(true);
    expect(agendaForDay(data, '2026-12-07').some((e) => e.kind === 'Class')).toBe(false);
    data.subjects[0]!.archived = true;
    expect(agendaForDay(data, '2026-10-19').some((e) => e.kind === 'Class')).toBe(false);
  });
});

describe('study-block boundaries and clashes', () => {
  const block: ViewBlock = {
    id: 'new',
    title: 'Study',
    assessmentId: 'requirements',
    startAt: '2026-10-19T11:00:00+02:00',
    endAt: '2026-10-19T11:45:00+02:00',
    status: 'Planned',
  };
  it.each([15, 180])('accepts the %i minute boundary', (minutes) => {
    const end = new Date(Date.parse(block.startAt) + minutes * 60000);
    const local = new Date(end.getTime() + 7200000).toISOString().slice(0, 19) + '+02:00';
    expect(validateBlock({ ...block, endAt: local })).toBeNull();
  });
  it.each([
    '2026-10-19T11:14:00+02:00',
    '2026-10-19T14:01:00+02:00',
    '2026-10-19T10:00:00+02:00',
    'invalid',
  ])('rejects invalid duration %s', (endAt) => {
    expect(validateBlock({ ...block, endAt })).not.toBeNull();
  });
  it('rejects cross-midnight intervals even if only 30 minutes', () => {
    expect(
      validateBlock({
        ...block,
        startAt: '2026-10-19T23:45:00+02:00',
        endAt: '2026-10-20T00:15:00+02:00',
      }),
    ).not.toBeNull();
  });
  it('allows touching endpoints but warns on nested and multiple overlaps', () => {
    const data = exampleView();
    expect(blockConflicts(data, block)).toHaveLength(0);
    expect(
      blockConflicts(data, {
        ...block,
        startAt: '2026-10-19T09:30:00+02:00',
        endAt: '2026-10-19T10:15:00+02:00',
      }),
    ).toHaveLength(2);
    expect(
      blockConflicts(data, {
        ...block,
        startAt: '2026-10-19T10:15:00+02:00',
        endAt: '2026-10-19T10:30:00+02:00',
      }),
    ).toHaveLength(1);
  });
  it('does not clash with itself or cancelled blocks', () => {
    const data = exampleView();
    expect(blockConflicts(data, data.blocks[0]!)).toHaveLength(0);
    data.blocks[0]!.status = 'Cancelled';
    expect(
      blockConflicts(data, {
        ...block,
        startAt: '2026-10-19T09:00:00+02:00',
        endAt: '2026-10-19T09:45:00+02:00',
      }),
    ).toHaveLength(0);
  });
});

describe('explained assessment ordering', () => {
  const now = Date.parse('2026-10-19T12:00:00+02:00');
  it('sorts urgency before manual priority and omits completed/archived records', () => {
    const data = exampleView();
    data.assessments[0]!.dueAt = '2026-10-23T12:00:00+02:00';
    data.assessments[1]!.dueAt = '2026-10-18T12:00:00+02:00';
    expect(rankedAssessments(data, now).map((r) => r.item.id)).toEqual(['quiz', 'requirements']);
    expect(rankedAssessments(data, now)[0]!.reason).toBe('Overdue · medium priority');
    data.assessments[1]!.archived = true;
    expect(rankedAssessments(data, now)).toHaveLength(1);
  });
  it.each([
    [24, '24 hours'],
    [72, '3 days'],
    [168, '7 days'],
    [169, 'later'],
  ])('uses the published %i hour boundary', (hours, phrase) => {
    const data = exampleView();
    data.assessments = [data.assessments[0]!];
    data.assessments[0]!.dueAt = new Date(now + Number(hours) * 3600000).toISOString();
    expect(rankedAssessments(data, now)[0]!.reason).toContain(phrase);
  });
  it('uses remaining effort then stable IDs for otherwise tied items', () => {
    const data = exampleView();
    const source = data.assessments[0]!;
    data.assessments = [
      { ...source, id: 'z', remainingMinutes: 10 },
      { ...source, id: 'b', remainingMinutes: 20 },
      { ...source, id: 'a', remainingMinutes: 10 },
    ];
    expect(rankedAssessments(data, now).map((r) => r.item.id)).toEqual(['a', 'z', 'b']);
  });
});
