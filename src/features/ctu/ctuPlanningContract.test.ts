import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { reconcileCtuAssessment, parseCtuPlannerLink } from './ctuPlanningContract';
import { prepareCtuImport, type CtuItem } from './ctuImportContract';
import { combinePortalPages } from './portalContract';
import { toPlannerInput } from '@/features/planner/plannerContract';
import { exampleView } from '@/features/planner/planningView';

async function fixture() {
  const stamp = Timestamp.fromMillis(1000);
  const row = (
    await prepareCtuImport(
      combinePortalPages([
        {
          kind: 'home',
          portalName: 'Example',
          course: 'Course',
          modules: [],
          assessments: [
            { module: 'Module', title: 'Task', due: '2026-10-26', sourceId: '1', submitted: false },
          ],
          documents: [],
          resources: [],
          warnings: [],
        },
      ]),
    )
  ).find((i) => i.kind === 'assessment')!;
  const source: CtuItem = { ...row, previousDue: '', createdAt: stamp, updatedAt: stamp };
  const assessment = {
    ...toPlannerInput('assessments', exampleView().assessments[0]!),
    title: source.title,
    completedAt: null,
    createdAt: stamp,
    updatedAt: stamp,
  };
  const link = {
    id: source.id,
    assessmentId: `ctu-${source.id}`,
    appliedTitle: assessment.title,
    appliedDue: assessment.dueAt,
    sourceRevision: stamp,
    conflict: false,
    createdAt: stamp,
    updatedAt: stamp,
  };
  return { source, assessment, link };
}
describe('CTU source to personal planning ownership', () => {
  it('updates source fields while retaining effort, notes, completion and all other choices', async () => {
    const { source, assessment, link } = await fixture();
    const before = {
      ...assessment,
      status: 'Completed' as const,
      remainingMinutes: 0,
      completedAt: assessment.updatedAt,
      description: 'My revision notes',
      archived: true,
    };
    const result = reconcileCtuAssessment(
      { ...source, title: 'Revised task', dueTime: '23:30' },
      before,
      link,
    );
    expect(result.assessment).toMatchObject({
      ...before,
      title: 'Revised task',
      dueAt: Timestamp.fromDate(new Date('2026-10-26T23:30:00+02:00')),
    });
    expect(result.conflict).toBe(false);
  });
  it('keeps personal title and due-date overrides and reports a conflict', async () => {
    const { source, assessment, link } = await fixture();
    const edited = {
      ...assessment,
      title: 'My title',
      dueAt: Timestamp.fromDate(new Date('2026-10-24T11:00:00+02:00')),
    };
    const result = reconcileCtuAssessment(source, edited, link);
    expect(result.assessment).toEqual(edited);
    expect(result.conflict).toBe(true);
    expect(result.changed).toBe(false);
  });
  it('preserves a student-selected planning time when CTU supplies only a date', async () => {
    const { source, assessment, link } = await fixture();
    const result = reconcileCtuAssessment(source, assessment, link);
    expect(result.assessment.dueAt.toDate().toISOString()).toBe('2026-10-26T10:00:00.000Z');
    expect(source.dueTime).toBe('');
  });
  it('rejects link redirection, extra fields and malformed timestamp metadata', async () => {
    const { link } = await fixture();
    const { id, ...data } = link;
    expect(parseCtuPlannerLink(id, data)).toEqual(link);
    expect(() => parseCtuPlannerLink(id, { ...data, assessmentId: 'some-other-task' })).toThrow();
    expect(() => parseCtuPlannerLink(id, { ...data, owner: 'another-user' })).toThrow();
    expect(() => parseCtuPlannerLink(id, { ...data, sourceRevision: 'yesterday' })).toThrow();
  });
  it('resumes source updates when a student resolves an override to the current CTU values', async () => {
    const { source, assessment, link } = await fixture();
    const current = { ...source, title: 'Current CTU title', dueTime: '20:00' };
    const edited = {
      ...assessment,
      title: current.title,
      dueAt: Timestamp.fromDate(new Date('2026-10-26T20:00:00+02:00')),
    };
    const result = reconcileCtuAssessment(current, edited, { ...link, conflict: true });
    expect(result.conflict).toBe(false);
    expect(result.appliedTitle).toBe(edited.title);
    expect(result.appliedDue.isEqual(edited.dueAt)).toBe(true);
    expect(result.changed).toBe(false);
  });
});
