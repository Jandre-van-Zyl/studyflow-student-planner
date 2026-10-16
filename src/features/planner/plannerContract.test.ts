import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { parsePlannerRecord, toPlannerInput, toPlannerView } from './plannerContract';
import { exampleView } from './planningView';

describe('planner storage contract', () => {
  it('round-trips SAST midnight without displaying the UTC date', () => {
    const block = {
      ...exampleView().blocks[0]!,
      startAt: '2026-10-19T00:00:00+02:00',
      endAt: '2026-10-19T00:30:00+02:00',
    };
    const input = toPlannerInput('blocks', block);
    const record = parsePlannerRecord('blocks', {
      ...input,
      createdAt: new Timestamp(1, 0),
      updatedAt: new Timestamp(2, 0),
    });
    expect(toPlannerView('blocks', 'block-a', record)).toMatchObject({
      startAt: block.startAt,
      endAt: block.endAt,
      revision: new Timestamp(2, 0),
    });
  });
  it.each(['2026-02-30T12:00:00+02:00', '2026-10-19T12:00:00Z', '2026-10-19T12:00:30+02:00'])(
    'rejects noncanonical/invalid date %s',
    (dueAt) => {
      expect(() =>
        toPlannerInput('assessments', { ...exampleView().assessments[0]!, dueAt }),
      ).toThrow();
    },
  );
  it('rejects extra stored fields and invalid completion semantics', () => {
    const input = toPlannerInput('subjects', exampleView().subjects[0]!);
    expect(() =>
      parsePlannerRecord('subjects', {
        ...input,
        owner: 'other',
        createdAt: new Timestamp(1, 0),
        updatedAt: new Timestamp(2, 0),
      }),
    ).toThrow();
    expect(() =>
      toPlannerInput('assessments', {
        ...exampleView().assessments[0]!,
        status: 'Completed',
        remainingMinutes: 90,
      }),
    ).toThrow();
  });
  it('rejects invalid IDs, dates, enums and duplicate path separators before Firestore', () => {
    expect(() =>
      toPlannerInput('classes', { ...exampleView().classes[0]!, activeFrom: '2025-02-29' }),
    ).toThrow();
    expect(() =>
      toPlannerInput('subjects', { ...exampleView().subjects[0]!, code: '../SE2' }),
    ).toThrow();
    expect(() =>
      toPlannerInput('blocks', { ...exampleView().blocks[0]!, assessmentId: 'x/y' }),
    ).toThrow();
    expect(() =>
      toPlannerInput('subjects', { ...exampleView().subjects[0]!, colour: 'red' } as never),
    ).toThrow();
  });
});
