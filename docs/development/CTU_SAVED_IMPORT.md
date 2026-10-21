# CTU saved import — first implementation stage

21 October 2026. Local implementation on `prototype/ctu-sync-20261021`; no cloud rules deployment, real account import, GitHub push or Hosting release is included.

## Student workflow and identity

Jandre explicitly chose an account-based workflow without another identity confirmation: the student signs into their own CTU portal, then **Connect CTU** collects and automatically saves into the StudyFlow UID that initiated the request. The identity checkbox has been removed. CTU credentials stay in CTU. The extension receives no Firebase token or write access.

The app captures the destination UID and session, validates the helper response and saves through the existing authenticated Firebase client. UID changes, sign-out and component cleanup abort pending work and ignore late receipts. Already submitted server transactions cannot be recalled by navigation; any committed data remains under the original owner, never the subsequent account. Cancel collection is available before saving starts.

This is a personal planning import, not proof that a CTU identity matches a Firebase email. The active portal session is the student's selected source. Displayed account/course labels separate observed contexts but are not verified identifiers. Shared-browser users must sign into their own CTU account. No identity popup is required.

## Implemented behavior

- Owner-scoped source modules, assessments, document links and resource titles persist and reload.
- The dashboard shows a saved CTU deadline section. Connect CTU shows full saved modules/resources, source observations and coverage.
- Deterministic SHA-256 document IDs deduplicate repeat imports. Full module labels preserve KM/PM distinctions. A source ID, when present, keeps an assessment identity stable across title/deadline changes.
- Changed deadlines retain the previous date/time. Unknown times remain unknown; no timezone conversion, effort, priority, type, completion or attendance is invented.
- All source items in a bounded import and its connection metadata commit in one transaction. More than 200 input records are rejected before writing. Existing records absent from partial collections are retained.
- Concurrent repeat imports converge. A collection older than the latest saved connection is rejected. Offline preflight prevents offline queued imports.
- Source records are separate from existing subjects/assessments/study blocks, so imports cannot overwrite personal planning work. They are not yet editable/plannable assessments.
- Failed saves retain the collected preview with Retry saving; saved-data load failures hide the source view and offer retry.

## Canonical contracts and rules

The unchanged helper v1 preview message remains validated by [portalContract.ts](../../src/features/ctu/portalContract.ts). The first persistence adapter is [ctuImportContract.ts](../../src/features/ctu/ctuImportContract.ts). It derives `seen` / `not-seen` / `unknown` submission observations using page provenance, without treating a missing upload as completion status.

New exact-schema paths:

- `users/{uid}/ctuItems/{sha256}`: source kind, portalName, course, title, module, sourceId, dueDate, dueTime, upload observation, validated document URL, previousDue, immutable createdAt and server updatedAt.
- `users/{uid}/ctuConnections/current`: observed account/course, capturedAt, bounded coverage/warnings, immutable createdAt and server updatedAt.

Both require an existing profile, verified Firebase email, active approvedStudents membership and the exact owner UID. Unknown fields, foreign access, hard deletes, invalid dates and forged timestamp/source-context updates are denied. Last capture time cannot move backwards. Rules validate structure and ownership, not institutional authenticity. See [firestore.rules](../../firebase/firestore.rules).

The source ID namespace includes observed portalName/course/kind/module. Missing IDs use full titles/URLs as fallback. Renamed contexts, missing-to-present IDs and same-titled repeated assessments require later reconciliation work. This stage does not promise cross-term identity stability or complete portal coverage. Existing helper page combining also remains a known limitation for identically titled records within one module.

## Local activation and cloud boundary

No package dependencies or extension permissions changed. Helper 0.1.3 remains compatible. `VITE_CTU_PROTOTYPE=true` exposes the route/dashboard integration. Emulator mode enables saving; cloud mode additionally requires `VITE_CTU_SAVE_ENABLED=true`, intentionally absent from the current cloud configuration. The existing cloud preview remains read-only until rules publication and real-data activation are explicitly approved.

To test with the installed helper, use its existing exact loopback origin, with port 4173 free:

```powershell
$env:VITE_CTU_PROTOTYPE = 'true'
npx firebase emulators:exec --project demo-studyflow --only auth,firestore "npx vite --mode emulator --host 127.0.0.1 --port 4173 --strictPort"
```

Use a synthetic verified/approved emulator account. The helper only matches `http://127.0.0.1:4173/ctu-sync`; port 5174 was used for isolated saved-data browser checks and cannot collect through this helper. Ordinary `npm run dev` retains its existing behavior. A real user's portal information should not be placed in disposable demo fixtures.

Cloud release sequence, after permission: review/deploy the tested Firestore rules, enable the cloud save flag, build, test an approved real import, and verify reload and owner isolation. This does not imply permission to publish Hosting or GitHub changes.

## Verification and remaining scope

See [CTU_Saved_Import_2026-10-21.md](../testing/CTU_Saved_Import_2026-10-21.md) for observed test outcomes.

Next implementation stage: source-to-planner subject mapping and draft promotion with missing planning fields, followed by merged assessment/planner views. Automatic refresh preferences, account/course reconciliation, store installation flow, richer statistics, weekly scheduling and PDF timetable extraction remain future work. Official CTU/API/SSO support has not been established.
