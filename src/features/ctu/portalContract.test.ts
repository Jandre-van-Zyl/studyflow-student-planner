import { describe, expect, it } from 'vitest';
import { capturePortalDocument } from './portalCapture';
import { combinePortalPages, parsePortalSnapshot, validAppSender } from './portalContract';

const origin = 'https://ctu.campusmanager.co.za/portal/';
function capture(page: string, html: string) {
  document.body.innerHTML = html;
  return capturePortalDocument(document, origin + page);
}
const home = () =>
  capture(
    'student-home.php',
    `<nav><a href="student-home.php">Home</a></nav><div>Hello Example Student!</div><p>The following assessments are due in 30 days</p><table><tr><th>Module</th><th>Assessment</th><th>Due</th></tr><tr><td>KM-03 Database - MDB622</td><td>FA1</td><td>2026-10-21</td></tr><tr><td>PM-02 Database - MDB622</td><td>Project</td><td>2026-10-24</td></tr></table>`,
  );
describe('CTU preview boundary', () => {
  it('captures only relevant fields, excluding credentials, grades and submitted-file links', () => {
    const page = capture(
      'student-uploads.php',
      `<nav><a href="student-home.php">Home</a></nav><div>KM-03 Database - MDB622</div><table><tr><th>Assessment</th><th>Due</th><th>Upload</th></tr><tr><td>FA1</td><td>2026/10/21 23:30</td><td><input type="file" id="file_123"></td></tr><tr><td>Uploaded: 2026/08/07 10:00</td><td><a href="/private-submission.rar">View uploaded assignment</a></td></tr></table><input name="password" value="secret"><p>Final mark 99</p>`,
    );
    expect(page.assessments).toEqual([
      {
        module: 'KM-03 Database - MDB622',
        title: 'FA1',
        due: '2026-10-21T23:30',
        sourceId: '123',
        submitted: true,
      },
    ]);
    expect(JSON.stringify(page)).not.toMatch(/secret|private-submission|Final mark/);
  });
  it('merges timed and date-only rows without collapsing modules sharing a suffix', () => {
    const upload = capture(
      'student-uploads.php',
      `<nav><a href="student-home.php">Home</a></nav><div>KM-03 Database - MDB622</div><table><tr><th>Assessment</th><th>Due</th><th>Upload</th></tr><tr><td>FA1</td><td>2026/10/21 23:30</td><td><input type="file" id="file_123"></td></tr></table>`,
    );
    const result = combinePortalPages([home(), upload], new Date('2026-10-21T10:00:00Z'));
    expect(result.assessments).toHaveLength(2);
    expect(result.assessments[0]?.due).toBe('2026-10-21T23:30');
    expect(result.assessments[1]?.due).toBe('2026-10-24');
    expect(result.assessments[0]?.sources).toEqual(['home', 'uploads']);
    expect(combinePortalPages([home(), home()]).assessments).toHaveLength(2);
  });
  it('does not capture result tables as modules and detects unloaded course details', () => {
    const page = capture(
      'student-courses.php',
      `<nav><a href="student-home.php">Home</a></nav><table><tr><th>Course</th><th>From</th><th>To</th></tr><tr><td>Current course</td><td>2026/02/01</td><td>2026/12/31</td></tr></table><table><tr><th>Assessment</th><th>Final % : Status</th></tr><tr><td>FA1</td><td>99</td></tr></table>`,
    );
    expect(page.modules).toEqual([]);
    expect(page.warnings.join(' ')).toMatch(/module/i);
  });
  it('requires valid authenticated page markers and the exact portal origin', () => {
    expect(() => capture('student-login.php', '<input type="password">')).toThrow();
    expect(() =>
      capturePortalDocument(document, 'https://evil.test/portal/student-home.php'),
    ).toThrow();
    expect(() => capture('student-home.php', '<h1>Maintenance</h1>')).toThrow();
  });
  it('rejects malformed dates rather than inventing deadlines', () => {
    expect(() =>
      capture(
        'student-home.php',
        '<nav><a href="student-home.php">Home</a></nav><table><tr><th>Module</th><th>Assessment</th><th>Due</th></tr><tr><td>M</td><td>A</td><td>2026-02-30</td></tr></table>',
      ),
    ).toThrow();
  });
  it('accepts validated snapshots but rejects extra keys, oversized payloads and unsafe document URLs', () => {
    const value = combinePortalPages([home()]);
    expect(parsePortalSnapshot(value)).toEqual(value);
    expect(() => parsePortalSnapshot({ ...value, password: 'secret' })).toThrow();
    expect(() =>
      parsePortalSnapshot({ ...value, assessments: Array(501).fill(value.assessments[0]) }),
    ).toThrow();
    expect(() =>
      parsePortalSnapshot({
        ...value,
        documents: [{ title: 'Document', url: 'javascript:alert(1)' }],
      }),
    ).toThrow();
  });
  it('keeps source coverage partial and reports conflicting source dates', () => {
    const other = home();
    other.assessments[0]!.due = '2026-10-22';
    other.kind = 'uploads';
    const value = combinePortalPages([home(), other]);
    expect(value.warnings.join(' ')).toMatch(/conflict/i);
    expect(value.coverage).toContain('home: next 30 days only');
    expect(value.coverage.join(' ')).toMatch(/timetable.*not parsed/i);
  });
  it('only permits the exact local app origin and route as an extension sender', () => {
    expect(validAppSender('http://127.0.0.1:4173/ctu-sync')).toBe(true);
    for (const url of [
      'http://localhost:4173/ctu-sync',
      'http://127.0.0.1:5173/ctu-sync',
      'http://127.0.0.1:4173/account',
      'https://evil.test/ctu-sync',
      'http://127.0.0.1:4173/ctu-sync?token=x',
    ])
      expect(validAppSender(url)).toBe(false);
  });
});
