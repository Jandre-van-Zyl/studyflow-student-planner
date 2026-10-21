import { Timestamp } from 'firebase/firestore';
import { parsePortalSnapshot, validPortalDue } from './portalContract';
import type { CtuPlannerLink } from './ctuPlanningContract';

export interface CtuItemInput {
  kind: 'module' | 'assessment' | 'document' | 'resource';
  portalName: string;
  course: string;
  title: string;
  module: string;
  sourceId: string;
  dueDate: string;
  dueTime: string;
  upload: 'seen' | 'not-seen' | 'unknown';
  url: string;
}
export interface CtuItem extends CtuItemInput {
  id: string;
  previousDue: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
export interface CtuConnection {
  observedIds?: string;
  portalName: string;
  course: string;
  capturedAt: Timestamp;
  coverage: string;
  warnings: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
export interface CtuSavedView {
  items: CtuItem[];
  connection: CtuConnection | null;
  links?: CtuPlannerLink[];
}
export const EMPTY_CTU: CtuSavedView = { items: [], connection: null };
export const MAX_IMPORT_ITEMS = 200;
const inputKeys = [
  'kind',
  'portalName',
  'course',
  'title',
  'module',
  'sourceId',
  'dueDate',
  'dueTime',
  'upload',
  'url',
];
function exact(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid saved CTU data.');
  const data = value as Record<string, unknown>;
  if (Object.keys(data).length !== keys.length || keys.some((key) => !Object.hasOwn(data, key)))
    throw new Error('Unexpected saved CTU fields.');
  return data;
}
function line(value: unknown, max = 300): value is string {
  return (
    typeof value === 'string' &&
    value.length <= max &&
    value === value.trim() &&
    ![...value].some(
      (character) =>
        character.charCodeAt(0) < 32 || [127, 8232, 8233].includes(character.charCodeAt(0)),
    )
  );
}
function metadata(data: Record<string, unknown>) {
  if (
    !(data.createdAt instanceof Timestamp) ||
    !(data.updatedAt instanceof Timestamp) ||
    data.updatedAt.toMillis() < data.createdAt.toMillis()
  )
    throw new Error('Invalid CTU save metadata.');
}
export function parseCtuItem(id: string, value: unknown): CtuItem {
  const d = exact(value, [...inputKeys, 'previousDue', 'createdAt', 'updatedAt']);
  metadata(d);
  if (
    !/^[a-f0-9]{64}$/.test(id) ||
    !['module', 'assessment', 'document', 'resource'].includes(String(d.kind)) ||
    !['portalName', 'course', 'title', 'module'].every((k) => line(d[k])) ||
    !d.title ||
    typeof d.sourceId !== 'string' ||
    !/^(\d{1,30})?$/.test(d.sourceId) ||
    !['seen', 'not-seen', 'unknown'].includes(String(d.upload)) ||
    !line(d.url, 1200) ||
    !line(d.dueDate, 10) ||
    !line(d.dueTime, 5) ||
    !line(d.previousDue, 16)
  )
    throw new Error('Invalid CTU item.');
  const due = String(d.dueDate) + (d.dueTime ? 'T' + String(d.dueTime) : '');
  if (
    d.kind === 'assessment'
      ? !d.module || !validPortalDue(due) || !due.startsWith('20') || d.url !== ''
      : d.dueDate !== '' || d.dueTime !== '' || d.upload !== 'unknown' || d.module !== ''
  )
    throw new Error('Invalid CTU deadline.');
  if (d.previousDue !== '' && (d.kind !== 'assessment' || !validPortalDue(String(d.previousDue))))
    throw new Error('Invalid previous CTU deadline.');
  if (d.kind === 'document') {
    const url = new URL(String(d.url));
    if (
      url.origin !== 'https://ctu.campusmanager.co.za' ||
      !url.pathname.startsWith('/notice/') ||
      !url.pathname.toLowerCase().endsWith('.pdf') ||
      url.search ||
      url.hash
    )
      throw new Error('Invalid CTU link.');
  } else if (d.url !== '') throw new Error('Unexpected CTU link.');
  return { id, ...d } as unknown as CtuItem;
}
export function parseCtuConnection(value: unknown): CtuConnection {
  const d = exact(value, [
    'portalName',
    'course',
    'capturedAt',
    'coverage',
    'warnings',
    'createdAt',
    'updatedAt',
    ...(value && typeof value === 'object' && Object.hasOwn(value, 'observedIds')
      ? ['observedIds']
      : []),
  ]);
  metadata(d);
  if (
    !line(d.portalName) ||
    !line(d.course) ||
    !line(d.coverage, 5000) ||
    !line(d.warnings, 5000) ||
    !(d.capturedAt instanceof Timestamp) ||
    (d.observedIds !== undefined &&
      (typeof d.observedIds !== 'string' ||
        d.observedIds.length > 12999 ||
        !/^(?:[a-f0-9]{64}(?:,[a-f0-9]{64})*)?$/.test(d.observedIds)))
  )
    throw new Error('Invalid CTU connection.');
  return d as unknown as CtuConnection;
}
export function ctuInput(item: CtuItem | (CtuItemInput & { id: string })): CtuItemInput {
  return Object.fromEntries(
    inputKeys.map((key) => [key, item[key as keyof CtuItemInput]]),
  ) as unknown as CtuItemInput;
}
export async function prepareCtuImport(value: unknown): Promise<(CtuItemInput & { id: string })[]> {
  const snapshot = parsePortalSnapshot(value);
  if (!snapshot.course.trim())
    throw new Error(
      'CTU course information was not collected. Sync again; your saved course and records have not been replaced.',
    );
  const common = {
    portalName: snapshot.portalName,
    course: snapshot.course,
    module: '',
    sourceId: '',
    dueDate: '',
    dueTime: '',
    upload: 'unknown' as const,
    url: '',
  };
  const inputs: CtuItemInput[] = [
    ...snapshot.modules.map((m) => ({
      ...common,
      kind: 'module' as const,
      title: m.name,
      sourceId: m.sourceId ?? '',
    })),
    ...snapshot.assessments.map((a) => ({
      ...common,
      kind: 'assessment' as const,
      title: a.title,
      module: a.module,
      sourceId: a.sourceId ?? '',
      dueDate: a.due.slice(0, 10),
      dueTime: a.due.slice(11),
      upload: a.submitted
        ? ('seen' as const)
        : a.sources.includes('uploads')
          ? ('not-seen' as const)
          : ('unknown' as const),
    })),
    ...snapshot.documents.map((d) => ({
      ...common,
      kind: 'document' as const,
      title: d.title,
      url: d.url,
    })),
    ...snapshot.resources.map((title) => ({ ...common, kind: 'resource' as const, title })),
  ];
  if (inputs.length > MAX_IMPORT_ITEMS)
    throw new Error('CTU import exceeds 200 records. Nothing was saved.');
  const rows = await Promise.all(
    inputs.map(async (input) => {
      // Observed context separates data; it is not an institutional identity assertion.
      const identity = JSON.stringify([
        input.portalName,
        input.course,
        input.kind,
        input.module,
        input.sourceId || input.url || input.title,
      ]);
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity));
      const id = Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, '0')).join(
        '',
      );
      const stamp = Timestamp.fromMillis(0);
      parseCtuItem(id, { ...input, previousDue: '', createdAt: stamp, updatedAt: stamp });
      return { id, ...input };
    }),
  );
  const unique = new Map<string, CtuItemInput & { id: string }>();
  for (const row of rows) {
    const old = unique.get(row.id);
    if (old && JSON.stringify(old) !== JSON.stringify(row))
      throw new Error('Ambiguous CTU records. Nothing was saved.');
    unique.set(row.id, row);
  }
  return [...unique.values()];
}
