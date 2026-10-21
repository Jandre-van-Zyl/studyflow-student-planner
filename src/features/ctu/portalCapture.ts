import type { PortalPageCapture } from './portalContract';

// Self-contained for chrome.scripting serialization. Never read inputs' values, cookies or scripts.
export function capturePortalDocument(doc = document, href = location.href): PortalPageCapture {
  const url = new URL(href);
  const kinds: Record<string, PortalPageCapture['kind']> = {
    'student-home.php': 'home',
    'student-uploads.php': 'uploads',
    'student-courses.php': 'courses',
    'notice-board.php': 'notices',
    'student-resources.php': 'resources',
  };
  const kind = kinds[url.pathname.replace('/portal/', '')];
  if (
    url.origin !== 'https://ctu.campusmanager.co.za' ||
    !url.pathname.startsWith('/portal/') ||
    !kind ||
    url.search ||
    url.hash
  )
    throw new Error('Open a supported CTU portal page.');
  if (!doc.querySelector('a[href="student-home.php"]') || doc.querySelector('input[type=password]'))
    throw new Error('Sign into CTU first.');
  const clean = (element: Element | null) =>
    (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const result: PortalPageCapture = {
    kind,
    portalName: '',
    course: '',
    modules: [],
    assessments: [],
    documents: [],
    resources: [],
    warnings: [],
  };
  const tables = [...doc.querySelectorAll('table')];
  const due = (raw: string) => {
    const value = raw.replaceAll('/', '-').replace(' ', 'T');
    if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(value))
      throw new Error('Unsupported CTU deadline format.');
    const date = new Date(value.slice(0, 10) + 'T00:00:00Z');
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value.slice(0, 10) ||
      (value.length > 10 && (Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59))
    )
      throw new Error('Invalid CTU deadline.');
    return value;
  };
  const headingBefore = (table: Element) => {
    // Find a short adjacent heading without serializing the surrounding private page.
    let node: Element | null = table;
    for (let level = 0; node && level < 4; level++, node = node.parentElement) {
      const previous = node.previousElementSibling;
      if (
        previous &&
        !previous.matches('table') &&
        !previous.querySelector('table') &&
        clean(previous)
      )
        return clean(previous);
    }
    return '';
  };
  if (kind === 'home') {
    const walker = doc.createTreeWalker(doc.body, 4);
    let greeting = '';
    while (walker.nextNode()) {
      const value = (walker.currentNode.textContent ?? '').trim();
      if (/^Hello [^!]{1,150}!$/.test(value)) {
        greeting = value;
        break;
      }
    }
    result.portalName = greeting?.replace(/^Hello /, '').replace(/!$/, '') ?? '';
  }
  for (const table of tables) {
    const rows = [...table.querySelectorAll('tr')];
    const first = rows[0];
    if (!first) continue;
    const headers = [...first.querySelectorAll('th,td')].map(clean);
    if (kind === 'home' && headers.join('|') === 'Module|Assessment|Due') {
      for (const row of rows.slice(1)) {
        const cells = [...row.querySelectorAll('td')];
        if (cells.length !== 3) throw new Error('CTU assessment table changed.');
        result.assessments.push({
          module: clean(cells[0]!),
          title: clean(cells[1]!),
          due: due(clean(cells[2]!)),
          sourceId: null,
          submitted: false,
        });
      }
    }
    if (kind === 'uploads' && headers.join('|') === 'Assessment|Due|Upload') {
      const module = headingBefore(table);
      if (!module) throw new Error('Cannot identify the CTU module.');
      for (let index = 1; index < rows.length; index++) {
        const row = rows[index]!;
        const cells = [...row.querySelectorAll('td')];
        if (/^Uploaded:/i.test(clean(row))) continue;
        if (cells.length !== 3) throw new Error('CTU upload table changed.');
        const sourceId =
          row.querySelector('input[type=file]')?.id.match(/^file_(\d+)$/)?.[1] ?? null;
        result.assessments.push({
          module,
          title: clean(cells[0]!),
          due: due(clean(cells[1]!)),
          sourceId,
          submitted: /^Uploaded:/i.test(clean(rows[index + 1] ?? null)),
        });
      }
    }
    if (kind === 'courses' && headers.join('|') === 'Course|From|To')
      result.course = clean(rows[1]?.querySelector('td') ?? null);
    if (kind === 'courses' && headers.join('|') === 'Module name|Facilitator') {
      for (const row of rows.slice(1)) {
        const cell = row.querySelector('td');
        if (!cell) continue;
        result.modules.push({
          name: clean(cell),
          sourceId:
            cell
              .querySelector('a')
              ?.getAttribute('href')
              ?.match(/viewmodresult\('\d+','(\d+)'\)/)?.[1] ?? null,
        });
      }
    }
  }
  if (kind === 'courses' && !result.modules.length)
    result.warnings.push('Course module details were not loaded; modules are incomplete.');
  if (kind === 'home' || kind === 'notices') {
    for (const link of doc.querySelectorAll('a[href]')) {
      const target = new URL(link.getAttribute('href')!, url);
      if (
        target.origin !== url.origin ||
        !target.pathname.startsWith('/notice/') ||
        !target.pathname.toLowerCase().endsWith('.pdf') ||
        target.search ||
        target.hash
      )
        continue;
      const container = link.closest('td') ?? link.parentElement;
      const title = clean(container)
        .replace(/Download document\s*$/i, '')
        .trim();
      result.documents.push({ title, url: target.href });
    }
  }
  if (kind === 'resources') {
    result.resources = [...doc.querySelectorAll('a[href]')]
      .filter((link) =>
        /^javascript:downloadresource\('\d+'\);?$/.test(link.getAttribute('href') ?? ''),
      )
      .map(clean);
    result.warnings.push(
      'Resource titles may include an older course; no download history is treated as a deadline.',
    );
  }
  return result;
}
