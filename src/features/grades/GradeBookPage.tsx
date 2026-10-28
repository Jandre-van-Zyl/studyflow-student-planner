import { useEffect, useRef, useState } from 'react';
import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/features/auth/authContext';
import { getFirebaseServices } from '@/lib/firebase/client';
import { overallGrades, type GradeReport } from './gradeContract';

export function GradeBookPage() {
  const { user, status } = useAuth();
  const [savedReports, setSavedReports] = useState<GradeReport[]>([]);
  const [previews, setPreviews] = useState<GradeReport[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [filter, setFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(status === 'ready');
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const active = useRef(true);
  const generation = useRef(0);
  const locked = useRef(false);
  const uid = status === 'ready' ? user?.uid : undefined;
  useEffect(() => {
    active.current = true;
    generation.current++;
    return () => {
      active.current = false;
    };
  }, [uid]);
  useEffect(() => {
    if (!uid) return;
    const { database } = getFirebaseServices();
    let listening = true;
    const fail = () => {
      if (!listening) return;
      clearTimeout(timer);
      setLoading(false);
      setLoadError(
        'Saved grades could not be loaded. Check your connection and retry. You can still preview PDFs.',
      );
    };
    const timer = setTimeout(fail, 15000);
    let stop = () => {};
    try {
      stop = onSnapshot(
        collection(database, 'users', uid, 'gradeReports'),
        { includeMetadataChanges: true },
        (snap) => {
          if (!listening || snap.metadata.fromCache || snap.metadata.hasPendingWrites) return;
          clearTimeout(timer);
          setLoading(false);
          try {
            setSavedReports(
              snap.docs.map((row) => validateReport(JSON.parse(String(row.data().payload)))),
            );
            setLoadError('');
          } catch {
            setLoadError('Saved grade data could not be read. Re-import the reports.');
          }
        },
        fail,
      );
    } catch {
      fail();
    }
    return () => {
      listening = false;
      clearTimeout(timer);
      stop();
    };
  }, [uid, retry]);
  async function importFiles(files: FileList | null) {
    if (!files?.length || locked.current) return;
    setMessage('');
    if (files.length > 10) {
      setError('Choose at most 10 PDFs at a time. No files from this selection were imported.');
      return;
    }
    const academicYear = Number(year);
    if (
      !/^\d{4}$/.test(year) ||
      !Number.isInteger(academicYear) ||
      academicYear < 2000 ||
      academicYear > 2099
    ) {
      setError('Enter an academic year from 2000 to 2099 before selecting reports.');
      return;
    }
    locked.current = true;
    const selectedFiles = Array.from(files);
    const attempt = generation.current;
    const isCurrent = () => active.current && generation.current === attempt;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { readGradePdf } = await import('./readGradePdf');
      const incoming: GradeReport[] = [];
      for (const file of selectedFiles) {
        if (!isCurrent()) return;
        incoming.push(validateReport(await readGradePdf(file, academicYear)));
      }
      if (!isCurrent()) return;
      const uniqueIncoming = mergeReports([], incoming);
      setPreviews((old) => mergeReports(old, uniqueIncoming));
      if (!user || status !== 'ready') {
        setMessage('Local preview only. Sign in to save reports.');
        return;
      }
      const { auth, database } = getFirebaseServices();
      const owner = auth.currentUser;
      const checkSession = () => {
        if (!isCurrent() || !owner || owner.uid !== user.uid || auth.currentUser !== owner)
          throw new Error('Your account or page changed before saving finished.');
      };
      for (const report of uniqueIncoming) {
        checkSession();
        const hash = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(`${report.course.toLowerCase()}|${report.year}|${report.kind}`),
        );
        const id = Array.from(new Uint8Array(hash), (n) => n.toString(16).padStart(2, '0')).join(
          '',
        );
        const ref = doc(database, 'users', user.uid, 'gradeReports', id);
        checkSession();
        await runTransaction(database, async (tx) => {
          const old = await tx.get(ref);
          checkSession();
          tx.set(ref, {
            course: report.course,
            year: report.year,
            kind: report.kind,
            payload: JSON.stringify(report),
            createdAt: old.exists() ? old.data().createdAt : serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      }
      if (isCurrent()) {
        setSavedReports((old) => mergeReports(old, uniqueIncoming));
        setPreviews((old) =>
          old.filter(
            (report) => !uniqueIncoming.some((saved) => reportKey(saved) === reportKey(report)),
          ),
        );
        setMessage(
          'Grade reports saved. Re-import a newer report to update this same course and year.',
        );
      }
    } catch (failure) {
      if (isCurrent())
        setError(
          (failure instanceof Error ? failure.message : 'Import failed.') +
            ' Any displayed preview is not a confirmed save.',
        );
    } finally {
      locked.current = false;
      if (isCurrent()) setBusy(false);
    }
  }
  const reports = mergeReports(savedReports, previews);
  const selected = reports
    .filter((r) => courseFilter === 'all' || r.course === courseFilter)
    .map((r) => ({
      ...r,
      rows: r.rows.filter((row) => filter === 'all' || String(row.year) === filter),
    }))
    .filter((r) => r.rows.length > 0);
  const overall = overallGrades(selected);
  const marked = overall.filter((r) => r.mark !== null);
  const average = marked.length ? marked.reduce((s, r) => s + r.mark!, 0) / marked.length : null;
  return (
    <section>
      <h1>Grade book</h1>
      <p className="mt-3 text-muted">
        Your academic record, separate from your study plan. Completed and historical modules stay
        here.
      </p>
      <div className="mt-6 rounded-lg border border-line bg-white p-5">
        <h2>Import CTU reports</h2>
        <p className="help mt-2">
          In MyCampusOnline, open Academic Record → current or previous course → Download result /
          Download progress report. Import both PDFs for each course. Newer imports replace the same
          report without adding duplicates.
        </p>
        <p className="help mt-2">
          PDFs are read on this device. Only course, year, module titles, marks and result statuses
          are saved; identity numbers and absenteeism are excluded.
        </p>
        <label className="mt-4 block max-w-[220px]">
          Report academic year
          <input
            type="number"
            min="2000"
            max="2099"
            value={year}
            disabled={busy}
            onChange={(e) => setYear(e.target.value)}
          />
        </label>
        <label className="mt-4 block">
          Result and progress PDFs
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            disabled={busy}
            onChange={(e) => {
              const files = e.target.files;
              void importFiles(files);
              e.target.value = '';
            }}
          />
        </label>
        {busy && <p role="status">Reading reports…</p>}
      </div>
      {loading && (
        <p role="status" className="notice mt-4">
          Loading your saved grades…
        </p>
      )}
      {loadError && (
        <div className="notice mt-4">
          <p role="alert">{loadError}</p>
          <button
            className="btn btn-secondary mt-3"
            onClick={() => {
              setLoading(true);
              setLoadError('');
              setRetry((value) => value + 1);
            }}
          >
            Retry saved grades
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="notice mt-4">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="notice mt-4">
          {message}
        </p>
      )}
      <label className="mt-6 block max-w-[220px]">
        Academic year
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All imported years</option>
          {[...new Set(reports.flatMap((r) => r.rows.map((row) => row.year)))].sort().map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 block max-w-[560px]">
        Course
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
          <option value="all">All imported courses</option>
          {[...new Set(reports.map((r) => r.course))].map((course) => (
            <option key={course}>{course}</option>
          ))}
        </select>
      </label>
      <div className="mt-6 flex flex-wrap gap-8 border-y border-line py-5">
        <p>
          <strong className="block text-3xl text-ink">
            {average === null ? '—' : average.toFixed(2) + '%'}
          </strong>
          Unweighted module average
        </p>
        <p>
          <strong className="block text-3xl text-ink">{marked.length}</strong>Modules with overall
          marks
        </p>
        <p>
          <strong className="block text-3xl text-ink">{overall.length - marked.length}</strong>
          Pending / no overall mark
        </p>
      </div>
      <p className="help mt-3">
        Each numeric module Overall mark counts once. Pending results and component marks are
        excluded. This is not a credit-weighted or official CTU qualification average.
      </p>
      {!reports.length && !loading && (
        <p className="mt-6">
          Import your reports to view grades. No sample or invented marks are shown.
        </p>
      )}
      {selected.map((report) => (
        <section key={`${report.course}-${report.year}-${report.kind}`} className="mt-8">
          <h2>{report.course}</h2>
          <p className="help">
            {report.year} · {report.kind === 'results' ? 'Letter of results' : 'Progress report'}
          </p>
          {previews.some((preview) => reportKey(preview) === reportKey(report)) && (
            <p className="help mt-2">Import preview · saving has not been confirmed.</p>
          )}
          <ul className="mt-4 divide-y divide-line">
            {report.rows.map((row, i) => (
              <li className="py-3" key={i}>
                <div className="flex flex-wrap justify-between gap-3">
                  <p className="font-semibold text-ink">{row.module}</p>
                  <p className="font-semibold text-accent">
                    {row.mark === null ? row.status || 'Pending' : `${row.mark}% · ${row.status}`}
                  </p>
                </div>
                <p className="help">
                  {row.assessment} · {row.year}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
function reportKey(report: GradeReport) {
  return `${report.course.toLowerCase()}|${report.year}|${report.kind}`;
}
function mergeReports(existing: GradeReport[], incoming: GradeReport[]) {
  const reports = new Map(existing.map((report) => [reportKey(report), report]));
  incoming.forEach((report) => reports.set(reportKey(report), report));
  return [...reports.values()];
}
function validateReport(value: unknown): GradeReport {
  const r = value as GradeReport;
  if (
    !r ||
    typeof r.course !== 'string' ||
    r.course.length > 300 ||
    !Number.isInteger(r.year) ||
    r.year < 2000 ||
    r.year > 2099 ||
    !['results', 'progress'].includes(r.kind) ||
    !Array.isArray(r.rows) ||
    r.rows.length > 300 ||
    r.rows.some(
      (v) =>
        !v ||
        typeof v.module !== 'string' ||
        v.module.length > 300 ||
        typeof v.assessment !== 'string' ||
        v.assessment.length > 300 ||
        typeof v.status !== 'string' ||
        v.status.length > 50 ||
        !Number.isInteger(v.year) ||
        v.year < 2000 ||
        v.year > 2099 ||
        (v.mark !== null &&
          (typeof v.mark !== 'number' || !Number.isFinite(v.mark) || v.mark < 0 || v.mark > 100)),
    )
  )
    throw new Error('Invalid saved report.');
  return r;
}
