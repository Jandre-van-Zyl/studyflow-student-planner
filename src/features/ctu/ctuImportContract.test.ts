import { describe, expect, it } from 'vitest';
import { combinePortalPages } from './portalContract';
import { prepareCtuImport } from './ctuImportContract';

export function importFixture() {
  return combinePortalPages(
    [
      {
        kind: 'uploads',
        portalName: 'Example Student',
        course: 'Software Development 2026',
        modules: [
          { name: 'KM Database MDB622', sourceId: '1' },
          { name: 'PM Database MDB622', sourceId: '2' },
        ],
        assessments: [
          {
            module: 'KM Database MDB622',
            title: 'FA1',
            due: '2026-10-26',
            sourceId: '12',
            submitted: false,
          },
        ],
        documents: [
          { title: 'Timetable', url: 'https://ctu.campusmanager.co.za/notice/example.pdf' },
        ],
        resources: ['Study guide'],
        warnings: [],
      },
    ],
    new Date('2026-10-21T10:00:00Z'),
  );
}

describe('persisted CTU source boundary', () => {
  it('rejects a missing course before changing durable IDs or connection context', async () => {
    await expect(prepareCtuImport({ ...importFixture(), course: '' })).rejects.toThrow(
      /course information/,
    );
  });
  it('uses repeatable IDs and keeps distinct modules and missing time/effort', async () => {
    const first = await prepareCtuImport(importFixture());
    expect(first).toEqual(await prepareCtuImport(importFixture()));
    expect(new Set(first.map((x) => x.id)).size).toBe(5);
    expect(first.find((x) => x.kind === 'assessment')).toMatchObject({
      dueDate: '2026-10-26',
      dueTime: '',
      upload: 'not-seen',
    });
    expect(JSON.stringify(first)).not.toMatch(/remainingMinutes|priority|Completed/);
  });
  it('keeps the same identified assessment when its title/deadline changes', async () => {
    const before = await prepareCtuImport(importFixture());
    const changed = importFixture();
    changed.assessments[0]!.due = '2026-10-27T23:30';
    changed.assessments[0]!.title = 'FA1 revised';
    const after = await prepareCtuImport(changed);
    expect(after.find((x) => x.kind === 'assessment')!.id).toBe(
      before.find((x) => x.kind === 'assessment')!.id,
    );
  });
  it('separates observed account/course contexts without claiming verified identity', async () => {
    const changed = importFixture();
    changed.portalName = 'Different Student';
    const before = await prepareCtuImport(importFixture());
    const after = await prepareCtuImport(changed);
    expect(after.every((item) => !before.some((old) => old.id === item.id))).toBe(true);
  });
  it('rejects oversized imports and invalid calendar dates before any save', async () => {
    const large = importFixture();
    large.resources = Array.from({ length: 201 }, (_, i) => `Resource ${i}`);
    await expect(prepareCtuImport(large)).rejects.toThrow(/200/);
    const invalid = importFixture();
    invalid.assessments[0]!.due = '2026-02-30';
    await expect(prepareCtuImport(invalid)).rejects.toThrow();
  });
  it('does not interpret a Home-only absence as a submission result', async () => {
    const value = importFixture();
    value.assessments[0]!.sources = ['home'];
    expect((await prepareCtuImport(value)).find((x) => x.kind === 'assessment')!.upload).toBe(
      'unknown',
    );
  });
});
