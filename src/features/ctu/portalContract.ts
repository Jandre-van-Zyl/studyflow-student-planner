// Canonical v1 boundary, shared by both app and extension builds. No persisted planner fields.
export const CTU_CHANNEL = 'studyflow-ctu-preview-v1';
export const APP_ORIGIN = 'http://127.0.0.1:4173';
export type PortalKind = 'home' | 'uploads' | 'courses' | 'notices' | 'resources';
export interface PortalModule {
  name: string;
  sourceId: string | null;
}
export interface PortalAssessment {
  module: string;
  title: string;
  due: string; // Source wall time or date only, deliberately not an inferred UTC instant.
  sourceId: string | null;
  submitted: boolean;
}
export interface PortalDocument {
  title: string;
  url: string;
}
export interface PortalPageCapture {
  kind: PortalKind;
  portalName: string;
  course: string;
  modules: PortalModule[];
  assessments: PortalAssessment[];
  documents: PortalDocument[];
  resources: string[];
  warnings: string[];
}
export interface PortalSnapshot {
  version: 1;
  capturedAt: string;
  portalName: string;
  course: string;
  modules: PortalModule[];
  assessments: (PortalAssessment & { sources: PortalKind[] })[];
  documents: PortalDocument[];
  resources: string[];
  coverage: string[];
  warnings: string[];
}
export function validAppSender(value: string): boolean {
  return value === APP_ORIGIN + '/ctu-sync';
}
export function validRequestId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9-]{36}$/.test(value);
}
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid CTU preview.');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== keys.length || keys.some((key) => !Object.hasOwn(record, key)))
    throw new Error('Unexpected CTU preview fields.');
  return record;
}
function text(value: unknown, max = 300): string {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    value !== value.trim() ||
    [...value].some((character) => character.charCodeAt(0) < 32)
  )
    throw new Error('Invalid CTU text.');
  return value;
}
function list<T>(value: unknown, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value) || value.length > 500)
    throw new Error('CTU preview exceeds its limit.');
  return value.map(parse);
}
function nullableId(value: unknown): string | null {
  if (value === null) return null;
  const id = text(value, 30);
  if (!/^\d+$/.test(id)) throw new Error('Invalid source identifier.');
  return id;
}
export function validPortalDue(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(value)) return false;
  const date = new Date(value.slice(0, 10) + 'T00:00:00Z');
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value.slice(0, 10) &&
    (value.length === 10 || (Number(value.slice(11, 13)) < 24 && Number(value.slice(14, 16)) < 60))
  );
}
export function parsePortalSnapshot(value: unknown): PortalSnapshot {
  const r = object(value, [
    'version',
    'capturedAt',
    'portalName',
    'course',
    'modules',
    'assessments',
    'documents',
    'resources',
    'coverage',
    'warnings',
  ]);
  if (
    r.version !== 1 ||
    typeof r.capturedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(r.capturedAt) ||
    !Number.isFinite(Date.parse(r.capturedAt))
  )
    throw new Error('Unsupported CTU preview version/date.');
  const modules = list(r.modules, (item) => {
    const m = object(item, ['name', 'sourceId']);
    return { name: text(m.name), sourceId: nullableId(m.sourceId) };
  });
  const assessments = list(r.assessments, (item) => {
    const a = object(item, ['module', 'title', 'due', 'sourceId', 'submitted', 'sources']);
    const due = text(a.due, 16);
    if (!validPortalDue(due) || typeof a.submitted !== 'boolean')
      throw new Error('Invalid CTU deadline/submission indicator.');
    const sources = list(a.sources, (source) => {
      if (!['home', 'uploads'].includes(String(source)))
        throw new Error('Invalid assessment source.');
      return source as PortalKind;
    });
    if (!sources.length || new Set(sources).size !== sources.length)
      throw new Error('Invalid source coverage.');
    return {
      module: text(a.module),
      title: text(a.title),
      due,
      sourceId: nullableId(a.sourceId),
      submitted: a.submitted,
      sources,
    };
  });
  const documents = list(r.documents, (item) => {
    const d = object(item, ['title', 'url']);
    const url = new URL(text(d.url, 1200));
    if (
      url.origin !== 'https://ctu.campusmanager.co.za' ||
      !url.pathname.startsWith('/notice/') ||
      !url.pathname.toLowerCase().endsWith('.pdf') ||
      url.search ||
      url.hash
    )
      throw new Error('Unsupported CTU document link.');
    return { title: text(d.title), url: url.href };
  });
  return {
    version: 1,
    capturedAt: r.capturedAt,
    portalName: text(r.portalName),
    course: text(r.course),
    modules,
    assessments,
    documents,
    resources: list(r.resources, (item) => text(item)),
    coverage: list(r.coverage, (item) => text(item)),
    warnings: list(r.warnings, (item) => text(item)),
  };
}
export function combinePortalPages(pages: PortalPageCapture[], now = new Date()): PortalSnapshot {
  const modules = new Map<string, PortalModule>();
  const assessments = new Map<string, PortalSnapshot['assessments'][number]>();
  const documents = new Map<string, PortalDocument>();
  const warnings = new Set<string>([
    'Portal timezone is not declared; confirm SAST before saving dates.',
    'No records have been saved to your planner.',
  ]);
  for (const page of pages) {
    page.warnings.forEach((warning) => warnings.add(warning));
    page.modules.forEach((module) => modules.set(module.name, module));
    for (const item of page.assessments) {
      const key = JSON.stringify([
        item.module.trim().toLowerCase(),
        item.title.trim().toLowerCase(),
      ]);
      const prior = assessments.get(key);
      if (!prior) assessments.set(key, { ...item, sources: [page.kind] });
      else {
        if (prior.due.slice(0, 10) !== item.due.slice(0, 10))
          warnings.add(
            'Deadline conflict between portal pages; review against the official assessment.',
          );
        const preferred = page.kind === 'uploads' ? item : prior;
        assessments.set(key, {
          ...preferred,
          submitted: prior.submitted || item.submitted,
          sources: [...new Set([...prior.sources, page.kind])],
        });
      }
    }
    page.documents.forEach((doc) => documents.set(doc.url, doc));
  }
  const kinds = new Set(pages.map((page) => page.kind));
  const coverage = ['home', 'uploads', 'courses', 'notices', 'resources'].map((kind) =>
    kinds.has(kind as PortalKind)
      ? kind === 'home'
        ? 'home: next 30 days only'
        : `${kind}: inspected page only`
      : `${kind}: not collected`,
  );
  coverage.push('timetable PDF: not parsed; no class slots imported');
  return parsePortalSnapshot({
    version: 1,
    capturedAt: now.toISOString(),
    portalName: pages.find((page) => page.portalName)?.portalName ?? '',
    course: pages.find((page) => page.course)?.course ?? '',
    modules: [...modules.values()],
    assessments: [...assessments.values()],
    documents: [...documents.values()],
    resources: [...new Set(pages.flatMap((page) => page.resources))],
    coverage,
    warnings: [...warnings],
  });
}
