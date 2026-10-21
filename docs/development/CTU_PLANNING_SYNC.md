# CTU information in the study planner

21 October 2026. Extends [saved CTU imports](CTU_SAVED_IMPORT.md) locally. Cloud saving remains disabled; the new rules are not deployed.

## Student behaviour

Connect CTU saves source observations under the initiating StudyFlow UID. The student can return later without collecting again. A sync a week later updates matching source records, retains unchanged records and adds genuinely new identified records. A seven-day freshness notice suggests resyncing; there is no scheduled background collection.

The saved queue automatically shows known deadlines in the next seven days, past due dates, missing planning details and personal progress for linked tasks. These are counts of collected information, not a complete institutional record. CTU uploads do not mark tasks completed or claim grades/attendance.

Choose **Plan this assessment** once. Title, date and any supplied time are reused. The student supplies effort and type, chooses a personal priority (default Medium), and chooses an existing subject or creates one from the full CTU module. A missing CTU time requires a clearly labelled personal planning target. Planning interprets wall times in SAST; CTU's timezone has not been independently confirmed. There is no identity confirmation checkbox.

This creates a normal assessment consumed by existing recommendations, workload/progress calculations, the deadline agenda and weekly study blocks. It does not automatically invent study sessions or effort. Full source titles/module names remain in source records and initial description; planner display lengths remain 120/80 characters. Automatically created subjects have deterministic IDs and unique generated codes; students may edit their display name/code normally.

## Canonical contracts

- [ctuPlanningContract.ts](../../src/features/ctu/ctuPlanningContract.ts) defines the exact link and field reconciliation.
- [ctuPlanningService.ts](../../src/features/ctu/ctuPlanningService.ts) activates planning and refreshes links.
- [ctuImportService.ts](../../src/features/ctu/ctuImportService.ts) saves observations, then refreshes linked assessments.
- [firestore.rules](../../firebase/firestore.rules) validates owner membership, exact schemas, metadata and same-owner references.

`users/{uid}/ctuPlannerLinks/{sourceHash}` contains assessmentId (`ctu-` plus the source hash), appliedTitle, appliedDue (minute-aligned Timestamp), sourceRevision, conflict, createdAt and updatedAt. ID is not a stored field. Source revision must equal the referenced source's updatedAt. Creation requires an existing/atomically created target assessment with the applied values. Links cannot redirect or be hard-deleted.

Connection metadata optionally adds `observedIds`: a bounded comma-separated list of up to 200 hashes. Older saved connections without the field remain readable. New collections populate it, allowing an explicit **Not seen in the latest sync** state. This does not assert source completeness.

## Repeat updates and student ownership

- One stable target ID per source; repeated/concurrent activation returns the existing link without resetting choices.
- Linked title/deadline follow CTU only while the current planner value equals the last imported value. Student overrides survive and produce a conflict notice. Restoring a field to the current CTU value resumes source-following on resync.
- Date-only updates retain the student's chosen planning time. The source date remains date-only in the CTU queue. No official time is invented.
- Description, type, subject choice, priority, estimated remaining effort, progress, completedAt, archive state and study blocks are not overwritten by sync.
- Full source import is atomic. Linked planner refreshes use individual transactions to stay within rule-access limits. A failure can leave sources saved and only some plans refreshed; retrying finishes idempotently. The UI reports an unconfirmed combined update rather than claiming everything succeeded.
- A subject may be created before activation fails; retry reuses it. It stays visible and editable, not hidden orphan data.
- Session/AbortSignal checks stop unsent work after sign-out, account replacement or navigation. An already submitted transaction may finish under the original UID. It cannot write under the replacement account.

## Removal and identity limitations

Absence from Home's next-30-day table or any partial page is not deletion. Missing records are retained and labelled; personal work is never hard-deleted. Actual automatic retirement requires explicit removal evidence or a validated complete scope, neither of which the current helper supplies. Existing user archive/cancel controls remain available. A future source retirement should preserve history and linked study blocks.

Source identity still uses observed account/course/kind/module plus numeric ID, or title/URL fallback. A missing-to-present identifier collision with an existing same-title item is rejected before saving rather than silently duplicated. Fully automatic reconciliation of renamed contexts, title changes without IDs, or repeated identical titles is not solved. The current page combiner can merge identical assessment names within a module; do not claim universal duplicate-proof identity.

## PDF investigation

Home contains a Semester 2 timetable, assessment schedule and student calendar. The actual timetable was downloaded and text extracted locally, with its page rendered and visually checked. It is text-based but uses merged cells. Monday shows OCC:SE2 Class at 09:00–12:00 and 13:00–14:00; lunch is 12:00–13:00. Labels such as PM, Practical and Support do not identify exact modules. Some Thursday cell borders do not align with hourly rows, so text order alone cannot safely infer every interval. No semester active date range is printed in the inspected grid.

The six-page mid-year student calendar was opened. September and October were visually inspected: a student-holiday range and an international-certification-exam period are present. The automated file download timed out; complete text extraction/OCR reliability was not established. Broad exam periods are institutional events, not personal exam bookings. The assessment-schedule PDF contents were not inspected.

Recommended next PDF stage: deterministic table-layout extraction for known timetable templates, source/version attribution, validated academic date ranges and holiday exceptions, plus calendar event types separate from classes. Unknown layouts remain visible document links. No PDF parser, class import or calendar-event persistence is implemented in this checkpoint.

## Local checks and activation

Use existing emulator startup and synthetic verified/approved accounts. `VITE_CTU_PROTOTYPE=true` exposes the feature. The installed helper matches only `http://127.0.0.1:4173/ctu-sync`; isolated UI checks on 5174 exercise saved data and planning, not collection.

Run `npm run check`, `npm run test:rules`, `npm run test:integration`, `npm run build:cloud` and `npm run build:ctu-helper`. Browser checks should create an imported assessment, refresh, confirm the normal dashboard recommendation and planner selector, then sign out. Local emulators lose data when stopped unless export/import is configured. Durable real-account use requires reviewed cloud rules deployment and explicitly enabling the cloud-save flag. Nothing in this document authorizes publication.
