export interface GradeRow {
  module: string;
  assessment: string;
  mark: number | null;
  status: string;
  year: number;
}
export interface GradeReport {
  course: string;
  year: number;
  kind: 'results' | 'progress';
  rows: GradeRow[];
}
export function parseGradeText(text: string, year: number): GradeReport {
  if (!Number.isInteger(year) || year < 2000 || year > 2099)
    throw new Error('Choose the academic year of this report.');
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const course = lines
    .find((s) => s.startsWith('Programme:'))
    ?.slice(10)
    .trim();
  const kind = lines.some((s) => s === 'LETTER OF RESULTS')
    ? 'results'
    : lines.some((s) => s === 'LEARNER PROGRESS REPORT')
      ? 'progress'
      : null;
  if (!course || !kind)
    throw new Error('Choose a supported CTU Letter of Results or Learner Progress Report.');
  const stop = lines.findIndex((s) => s === 'ABSENTEEISM' || s.startsWith('Status Description:'));
  const content = stop < 0 ? lines : lines.slice(0, stop);
  const rows: GradeRow[] = [];
  let module = '';
  for (let i = 0; i < content.length; i++) {
    let line = content[i]!;
    if (
      /^(KM|PM|WM)-\d{2}\b/.test(line) &&
      (kind === 'results' || /\(\d+-(KM|PM|WM)-\d+\)$/.test(line))
    ) {
      if (kind === 'results') {
        while (
          i + 1 < content.length &&
          !/^(KM|PM|WM)-\d{2}\b/.test(content[i + 1]!) &&
          !/\s(?:20\d{2}|Pending|module)$/.test(line)
        )
          line += ' ' + content[++i];
        const result = line.match(/\s(\d+(?:\.\d+)?)\s+([A-Z/]+)\s+(20\d{2})$/);
        const title = line.replace(
          /\s+(?:\d+(?:\.\d+)?\s+[A-Z/]+\s+20\d{2}|Pending Pending Pending|No overall result set up for this module)$/,
          '',
        );
        rows.push({
          module: title,
          assessment: 'Overall',
          mark: result ? Number(result[1]) : null,
          status: result ? result[2]! : line.includes('No overall') ? 'Not configured' : 'Pending',
          year: result ? Number(result[3]) : year,
        });
      } else {
        module = line.replace(/\s*\(\d+-(KM|PM|WM)-\d+\)$/, '');
      }
    } else if (kind === 'progress' && module) {
      const result = line.match(/^(.*?)\s+(\d+(?:\.\d+)?)\s+([A-Z/]+)$/);
      if (result)
        rows.push({
          module,
          assessment: result[1]!,
          mark: Number(result[2]),
          status: result[3]!,
          year,
        });
      else if (line === 'No results available for this module')
        rows.push({ module, assessment: 'Overall', mark: null, status: 'Pending', year });
    }
  }
  if (
    !rows.length ||
    rows.length > 300 ||
    rows.some(
      (r) =>
        r.module.length > 300 ||
        r.assessment.length > 300 ||
        (r.mark !== null && (r.mark < 0 || r.mark > 100)),
    )
  )
    throw new Error(
      'This report layout or its marks could not be read safely. Nothing was imported.',
    );
  return { course, year, kind, rows };
}
export function overallGrades(reports: GradeReport[]) {
  const map = new Map<string, GradeRow>();
  // Letter overall results take precedence over progress detail; never mix component marks.
  for (const report of [...reports].sort(
    (a, b) => Number(a.kind === 'results') - Number(b.kind === 'results'),
  ))
    for (const row of report.rows)
      if (row.assessment === 'Overall')
        map.set(`${report.course.toLowerCase()}|${row.year}|${row.module.toLowerCase()}`, row);
  return [...map.values()];
}
