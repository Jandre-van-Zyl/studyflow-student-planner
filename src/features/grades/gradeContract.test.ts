import { describe, expect, it } from 'vitest';
import { overallGrades, parseGradeText } from './gradeContract';
const letter = `LETTER OF RESULTS
Programme: Software Engineer
Module % Status Year of study
KM-03 Database Design - MDB622 90 P 2026
KM-04 Project Management -
SPM622 Pending Pending Pending
KM-05 Mathematics - MAT621 85 P 2026
PM-03 Applications No overall result set up for this module
PM-04 Testing - SDT621 97 P 2026
Status Description:`;
describe('grade report interpretation', () => {
  it('preserves pending marks and reads wrapped module titles', () => {
    const r = parseGradeText(letter, 2026);
    expect(r.rows).toHaveLength(5);
    expect(r.rows[1]!.mark).toBeNull();
    expect(r.rows[1]!.module).toContain('SPM622');
    expect(r.rows[3]!.status).toBe('Not configured');
  });
  it('does not double-count progress Overall or component marks', () => {
    const results = parseGradeText(letter, 2026);
    const progress = parseGradeText(
      `LEARNER PROGRESS REPORT\nProgramme: Software Engineer\nRESULTS\nKM-03 Database Design - MDB622 (25120100100-KM-03)\nAssessment Mark S\nOverall 90 P\nFA1 100 A\nABSENTEEISM\nID number: private`,
      2026,
    );
    const rows = overallGrades([results, progress]).filter((r) => r.mark !== null);
    expect(rows).toHaveLength(3);
    expect(rows.reduce((s, r) => s + r.mark!, 0) / rows.length).toBeCloseTo(90.6667, 3);
    expect(JSON.stringify(progress)).not.toContain('private');
  });
  it('rejects unsupported reports and out-of-range marks', () => {
    expect(() => parseGradeText('Not a CTU report', 2026)).toThrow();
    expect(() => parseGradeText(letter.replace('90 P', '190 P'), 2026)).toThrow();
  });
});
