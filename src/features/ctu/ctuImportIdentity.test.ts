import { describe, expect, it } from 'vitest';
import { reconcileCtuImport } from './ctuImportIdentity';
import type { CtuItemInput } from './ctuImportContract';

function source(overrides: Partial<CtuItemInput & { id: string }> = {}) {
  return {
    id: 'original',
    kind: 'assessment' as const,
    portalName: 'Student',
    course: 'Course',
    title: 'FA1',
    module: 'KM Module',
    sourceId: '',
    dueDate: '2026-10-29',
    dueTime: '',
    upload: 'unknown' as const,
    url: '',
    ...overrides,
  };
}
describe('durable CTU source identity', () => {
  it('adopts an unambiguous reference and supplied time while retaining the original ID', () => {
    const incoming = source({ id: 'reference-hash', sourceId: '12', dueTime: '12:30' });
    expect(reconcileCtuImport([incoming], [source()])).toEqual([{ ...incoming, id: 'original' }]);
  });
  it('keeps the reference when a later collection has only a title', () => {
    const old = source({ sourceId: '12' });
    expect(reconcileCtuImport([source({ id: 'title-hash' })], [old])).toEqual([old]);
  });
  it('finds the original ID after reference adoption even if the title changes', () => {
    const old = source({ sourceId: '12' });
    const renamed = source({ id: 'reference-hash', sourceId: '12', title: 'FA1 revised' });
    expect(reconcileCtuImport([renamed], [old])).toEqual([{ ...renamed, id: old.id }]);
  });
  it('does not merge two identified assessments just because their labels match', () => {
    const old = source({ sourceId: '12' });
    const other = source({ id: 'other', sourceId: '13' });
    expect(reconcileCtuImport([other, old], [old])).toEqual([other, old]);
  });
  it('refuses two possible reference upgrades for one legacy item', () => {
    expect(() =>
      reconcileCtuImport(
        [source({ id: 'first', sourceId: '12' }), source({ id: 'second', sourceId: '13' })],
        [source()],
      ),
    ).toThrow(/ambiguous/);
  });
  it('refuses a missing reference that could belong to either saved assessment', () => {
    expect(() =>
      reconcileCtuImport(
        [source()],
        [source({ id: 'first', sourceId: '12' }), source({ id: 'second', sourceId: '13' })],
      ),
    ).toThrow(/ambiguous/);
  });
  it('refuses conflicting identified and unidentified entries in the same collection', () => {
    expect(() =>
      reconcileCtuImport([source(), source({ id: 'reference-hash', sourceId: '12' })], []),
    ).toThrow(/ambiguous/);
  });
  it.each([
    { portalName: 'Other Student' },
    { course: 'Other Course' },
    { module: 'Other Module' },
    { title: 'FA2' },
    { kind: 'module' as const },
  ])('does not adopt a reference across a changed identity context %j', (context) => {
    const incoming = source({ id: 'new-context', sourceId: '12', ...context });
    expect(reconcileCtuImport([incoming], [source()])).toEqual([incoming]);
  });
});
