import type { CtuItemInput } from './ctuImportContract';

type SourceRow = CtuItemInput & { id: string };
const sameContext = (a: SourceRow, b: SourceRow) =>
  a.kind === b.kind &&
  a.portalName === b.portalName &&
  a.course === b.course &&
  a.module === b.module;
const sameLabel = (a: SourceRow, b: SourceRow) =>
  sameContext(a, b) && a.title === b.title && a.url === b.url;

function ambiguous(row: SourceRow): never {
  throw new Error(
    `CTU source references are ambiguous for ${row.kind}: “${row.title}”. The existing items were kept; nothing from this collection was saved.`,
  );
}

// Keep durable source IDs: planner links and student completion refer to them.
export function reconcileCtuImport(rows: SourceRow[], previous: SourceRow[]): SourceRow[] {
  const resolved = rows.map((row) => {
    const labelled = previous.filter((old) => sameLabel(old, row));
    const batch = rows.filter((other) => sameLabel(other, row));
    if (batch.length > 1 && batch.some((other) => !other.sourceId)) ambiguous(row);
    if (!['assessment', 'module'].includes(row.kind)) return row;

    if (row.sourceId) {
      const identified = previous.filter(
        (old) => sameContext(old, row) && old.sourceId === row.sourceId,
      );
      const legacy = labelled.filter((old) => !old.sourceId);
      if (identified.length > 1 || (identified.length && legacy.length)) ambiguous(row);
      if (identified.length === 1) return { ...row, id: identified[0]!.id };
      if (legacy.length) {
        if (labelled.length !== 1 || batch.length !== 1) ambiguous(row);
        return { ...row, id: legacy[0]!.id };
      }
      return row;
    }

    if (labelled.length > 1) ambiguous(row);
    const old = labelled[0];
    return old ? { ...row, id: old.id, sourceId: old.sourceId } : row;
  });
  const ids = new Set<string>();
  for (const row of resolved) {
    if (ids.has(row.id)) ambiguous(row);
    ids.add(row.id);
  }
  return resolved;
}
