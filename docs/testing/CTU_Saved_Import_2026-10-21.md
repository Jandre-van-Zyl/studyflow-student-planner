# CTU saved import verification — 21 October 2026

Local-only first persistence stage. Tests use synthetic data and demo-studyflow emulators. No real CTU information was saved to cloud Firestore during this task.

## Evidence

- Test-first contract checkpoint: `942d3f7`. Initial focused command failed because the new contract module did not exist; five behavior tests passed after implementation. This is initial missing-feature RED evidence, not five observed assertion failures.
- `npm run check`: final run passed formatting, lint with zero errors/one inherited AuthProvider warning, TypeScript, **216 app tests** and production build. An earlier run found a new control-character regex lint error, corrected by explicit character-code validation. Saved-panel tests verify date precision, change notices and load-failure behavior.
- `npm run test:rules`: 118 passing cases, including 11 new CTU cases for owner/anonymous/foreign access, schema, metadata, invalid dates, previous deadline integrity and monotonic capture metadata.
- `npm run test:integration`: **16 passing cases**, including five new real Auth/Firestore cases covering automatic save/reload, repeat and concurrent idempotence, changed deadlines, partial collection retention, stale collection rejection, account isolation, cancelled calls, offline behavior and membership revocation. A real 200-item transaction passed; a 201-item attempt was rejected without adding records.
- `npm run build:cloud` and `npm run build:ctu-helper`: passed. Helper code/permissions/version unchanged at 0.1.3. Current cloud configuration has saving disabled.
- Browser: isolated Opera tab at localhost:5174, actual emulator Auth/rules/listeners, synthetic fixture. Saved CTU deadlines render on the dashboard with missing-time labels and a changed-deadline notice. The Connect CTU page reloaded from the server with two distinct modules and resource metadata, and had no identity checkbox. Sign-out immediately removed saved information and returned to login. Captured browser error logs were empty. Screenshot visually reviewed in-session; no screenshot file was exported. Collection itself is not exercised on this port because helper permissions match only localhost:4173. App message-to-save behavior is tested in component tests; source collection was verified separately in the earlier read-only prototype.

The initial sandboxed emulator run could not start its hub. Retrying with approved loopback process access succeeded. This was a local execution limitation, not a failed rules assertion.

## Limits

No new coverage percentage measured. No claim of a real CTU-to-cloud save, automatic background synchronization, official source-identity verification, full accessibility certification or all capstone acceptance cases. Source draft records do not yet create valid planner assessments; existing personal records remain untouched by the import service. UI fixtures are explicitly synthetic and were seeded independently for presentation testing; real service integration is evidenced by the emulator suite.
