# StudyFlow requirements and test plan

Proposed baseline, 15 October 2026. Read with `Student_Planner_Full_Project_Plan.md`. Requirements, thresholds and test cases are for group/client review. **All application tests below are Not Run.** The planner has not been implemented. User-confirmed direction: student planner with a minimal stack; confirmed meeting roles: Dewald team lead, Aneesah minute-taker. React/TypeScript/Tailwind/Firebase and the technical assignments are recommendations.

## 1 Actors and acceptance workflow

Jandre confirmed the five Group 1 students as the client and primary stakeholders on 15 October 2026. Each student owns a private planner. A second student owns a separate planner and is used to verify isolation. Client representatives/evaluation participants give real feedback but do not receive access to everyone's records. The first release has no teacher, parent or shared group editing role.

Main acceptance journey: sign in -> create subjects/classes -> add assessments -> inspect explained priority -> plan a dated study block -> see budget/clash warnings -> update work/completion -> reload -> verify another account cannot access those records.

## 2 Functional requirements

| ID | Priority | Requirement | Acceptance condition |
| --- | --- | --- | --- |
| FR-01 | Must | Register, sign in and sign out with Firebase email/password authentication. | Valid account can access the app; errors are handled; signing out removes current planner data from the UI and detaches listeners. Passwords are never stored in Firestore. |
| FR-02 | Must | Save display name and daily study budgets for ISO weekdays 1-7. | Each budget is an integer 0-1440 minutes; all seven days exist; a saved change persists and recalculates the affected workload view. Timezone is Africa/Johannesburg for this release. |
| FR-03 | Must | Create/edit/archive/restore subjects with a name, code and allowed colour token. | Name/code validation passes; own subjects persist; archived subjects disappear from new-entry choices but existing records remain viewable. Subject history is retained. |
| FR-04 | Must | Define a weekly class slot with subject, weekday, local start/end, active date range and optional room. | Valid own subject; weekday 1-7; end after start on the same day; active end not before active start. Occurrences appear only on matching active dates. |
| FR-05 | Must | Create/edit/archive/restore assessments with subject, title/type, deadline, priority and remaining effort. | Data belongs to the signed-in student, valid references and values persist, arbitrary blank/invalid fields are rejected, archived records are excluded from advice. |
| FR-06 | Must | Set To Do/In Progress/Completed state and reopen an assessment. | Completion sets remaining minutes to zero and completedAt; reopening requires a positive remaining estimate and clears completedAt. Saved study blocks are retained, not silently removed. |
| FR-07 | Must | Search/filter assessments by text, subject and status, including completed/archive views. | Results match the signed-in student's loaded dataset and filters; empty/error states are distinct from a genuinely empty planner. |
| FR-08 | Must | Display classes, assessment deadlines and study blocks for a chosen week. | Previous/current/next week navigation works; events fall on the correct SAST date, sorted by time; different event types have text labels. Mobile supports a selected-day view. |
| FR-09 | Must | Create/edit/cancel dated study blocks linked to an own assessment and mark eligible blocks done. | Start/end on one local day; duration 15-180 minutes; required assessment reference is valid. Future blocks cannot be marked done before their start; cancellation excludes their allocation from workload. |
| FR-10 | Must | Warn about overlap with loaded classes and non-cancelled blocks. | Show the conflicting item/time before save; touching endpoints are allowed; a student can change the time or explicitly confirm an overlap. Rules do not claim a distributed collision lock. |
| FR-11 | Must | Rank incomplete active assessments and explain the order. | Urgency buckets, priority, due time, remaining effort and stable-ID tie rules match the published algorithm. Completed/archived items never appear; the top item includes an explanation. |
| FR-12 | Must | Show workload/progress and in-app deadline indicators. | Daily allocation and budget difference are correct; zero-budget days display safely; overdue/due-soon counts match the same snapshot/time; completed counts are labelled. Alerts appear while the app is open, with no background notification promise. |
| FR-13 | Should | Export the student's assessment list to CSV. | Correct own records/fields/escaping; spreadsheet formula-like cell values are made safe; export failure is visible. Add only after the core passes. |
| FR-14 | Could | Offer a focus timer without writing each tick to Firestore. | If selected, calculate from timestamps, handle pause/reset/visibility changes and never call elapsed timer time verified study. Not a requirement for the core demo. |
| FR-15 | Could | Offer a dark colour mode. | If selected, preserve readable labels, focus and warning meaning. It does not replace an already usable light interface. |

### Field baseline

Subject: trimmed name 1-80 characters; code 1-20; colour from a short fixed palette. Assessment: trimmed title 1-120; description up to 2000; supported type/priority/status; dueAt is a timestamp; remaining minutes integer 1-14400 when incomplete and zero when completed. Study-block title 1-120; valid same-day interval 15-180 minutes. Location up to 120 characters. Every document has explicit allowed keys and timestamps; no editable owner or privilege field is accepted.

The 14400-minute estimate limit is a proposed input ceiling, not a recommended study load. Confirm field limits with the client and keep UI, service validation, rules and test data consistent. Display effort as the student's estimate rather than a computed completion prediction.

## 3 Non-functional requirements

| ID | Quality | Proposed measurable criterion | Verification |
| --- | --- | --- | --- |
| NFR-01 | Privacy/access | All tested unauthenticated and other-UID reads/writes are denied across profile and four feature collections; user switching clears displayed prior data. | Emulator rules tests plus two-account browser check. |
| NFR-02 | Stored-data validity | All defined malformed-type, extra-key, invalid-enum, missing-reference and timestamp-order writes are denied as specified. No passwords or service-account credentials stored in app documents/client code. | Direct SDK/emulator writes, data inspection and code review. |
| NFR-03 | Date correctness | The specified urgency, due-now, midnight, week-start/end, class range and interval-boundary cases pass using an injected clock. | Pure unit tests and one browser timezone check. |
| NFR-04 | Responsive usability | Core forms/dashboard work at widths 360, 768 and 1366 pixels without unintended page overflow; mobile week view supports readable day selection. | Browser/manual screenshots and acceptance record. |
| NFR-05 | Accessibility | Core actions work by keyboard, fields have visible associated labels/errors, focus is visible and status meaning is conveyed with text. | Keyboard walkthrough and contrast/label review; do not claim a formal accessibility certification. |
| NFR-06 | Calculation performance | On a recorded development machine, priority/workload calculation for a synthetic dataset of 200 assessments and 200 blocks is below 100 ms in each of ten measured runs. | Actual measurements with dataset/machine/browser and warm/cold context recorded; Firebase latency measured separately. |
| NFR-07 | Error handling | A denied/network-failed save shows an error, retains entered values and does not falsely confirm persistence. Missing data is not reported as a successful zero result. | Failure simulation and recovery check. |
| NFR-08 | Maintainability/reproducibility | Shared TypeScript contracts and one source for each calculation; strict type check, lint, tests and build pass; README can reproduce the setup on a second machine. | Executed checks and clean setup by another member. |
| NFR-09 | Cost-conscious operation | No production writes per timer tick, no duplicate listener per card and all listeners detach on sign-out; monitor actual Firestore usage within agreed demo quota. | Code/network review and actual console/emulator metrics. |

These are proposed targets, not achieved results. If a target changes, record the reason, owner, version and affected acceptance/test cases before presenting results.

## 4 Exact calculation contracts

### Advice

Use the same `now` for every item. Exclude Completed/archived assessments. Bucket overdue = 0; now through 24 h inclusive = 1; above 24 through 72 h = 2; above 72 through 168 h = 3; later = 4. Within bucket sort High before Medium before Low, then dueAt ascending, remainingMinutes ascending and stable ID. Explain both urgency and manual priority. Quick-task badge means remaining minutes <=30, not a ranking override.

### Allocation

For a local day, add duration in minutes of non-cancelled study blocks, including Done. Daily excess = allocated minus the declared weekday budget; show an overload warning only if positive. Classes are outside this study-only budget. Zero allocation/zero budget is a valid day, not an error. A positive allocation with zero budget warns and must not produce NaN/Infinity. The metric is reserved/planned duration, not proof of time actually worked.

### Overlap and history

Intervals are half-open: overlap if startA < endB and startB < endA. Expand weekly classes only within their active dates. Exclude Cancelled blocks. Warning is advisory against the loaded data and requires explicit confirmation to keep the overlap. Completing/archiving an assessment preserves linked blocks; the UI labels the linked assessment's state and permits cancelling unnecessary future blocks.

## 5 Proposed test cases

All rows are **Not Run**. Add tester, date, environment, actual result, evidence and any defect ID when executed. Never copy expected outcomes into actual results without running the case.

| Test | Covers | Scenario and expected result | Level |
| --- | --- | --- | --- |
| TC-01 | FR-01 | Valid registration/login reaches the private planner; bad credentials show a handled error. | Browser/integration |
| TC-02 | FR-01, NFR-01 | Sign out, switch from user A to B: A's data disappears and A's listeners are detached. | Browser/integration |
| TC-03 | NFR-01 | Unauthenticated client reads/writes every protected path: denied. | Rules emulator |
| TC-04 | NFR-01 | User A directly reads/writes user B profile/subject/class/assessment/block paths: denied. | Rules emulator |
| TC-05 | NFR-02 | Extra privilege/owner field, wrong enum or malformed data type: denied by rules. | Rules emulator |
| TC-06 | FR-02 | Save budgets including zero; reload; same seven values are shown and workload changes. | Integration |
| TC-07 | FR-02 | Negative, fractional, missing-day or >1440-minute budget: rejected. | Unit/rules |
| TC-08 | FR-03 | Create/edit/archive subject: active choices update; related existing work remains visible. | Browser/integration |
| TC-09 | FR-04 | Valid class appears on matching weekday within its active date range only. | Unit/integration |
| TC-10 | FR-04, NFR-02 | Reversed class time/date range or foreign/missing subject reference: rejected. | Unit/rules |
| TC-11 | FR-05 | Valid assessment persists; reload preserves exact subject, deadline and effort. | Integration |
| TC-12 | FR-05, NFR-02 | Blank title, invalid priority/type, negative effort or foreign reference: rejected. | Unit/rules |
| TC-13 | FR-06 | Complete sets zero effort and completedAt; reopen requires positive effort and clears completedAt. | Unit/integration/rules |
| TC-14 | FR-06, FR-09 | Assessment completion/archive retains block history and shows the assessment state on linked blocks. | Integration |
| TC-15 | FR-07 | Subject/status/search filters return the correct own items, including empty and archive views. | Browser/integration |
| TC-16 | FR-08, NFR-03 | A deadline at 00:30 SAST appears on that SAST date, including across UTC midnight. | Unit/browser |
| TC-17 | FR-08 | Previous/current/next week and mobile selected-day view show the right combined events. | Browser |
| TC-18 | FR-09 | Valid dated block saves and is visible after reload; cancel removes it from allocated workload. | Integration |
| TC-19 | FR-09, NFR-02 | Reversed, cross-midnight, <15 or >180-minute block or missing/foreign assessment: rejected. | Unit/rules |
| TC-20 | FR-09 | Future block cannot be marked Done before its start; eligible block state persists. | Unit/integration/rules |
| TC-21 | FR-10 | Class 09:00-10:00 and block 09:30-10:15: conflict shown; change time or explicitly confirm overlap. | Unit/browser |
| TC-22 | FR-10 | Class ends 10:00 and block starts 10:00; cancelled-block overlap: no conflict warning. | Unit |
| TC-23 | FR-11 | Completed/archived items excluded; overdue items lead; stable ties use the published keys. | Unit |
| TC-24 | FR-11, NFR-03 | Test exact 0/24/72/168-hour boundaries and one millisecond either side: correct bucket/explanation. | Unit |
| TC-25 | FR-11 | High/Medium/Low within one bucket sort as documented; quick-task badge does not override that order. | Unit |
| TC-26 | FR-12 | Two non-cancelled 45-minute blocks and 60-minute budget: 90 allocated, 30 over. | Unit/browser |
| TC-27 | FR-12 | Zero budget with zero blocks is neutral; zero budget with a block warns without invalid arithmetic. | Unit/browser |
| TC-28 | FR-12 | Done blocks count, Cancelled blocks do not; completed/overdue task counts match the same time snapshot. | Unit |
| TC-29 | NFR-07 | Simulated offline/denied write: no false success, inputs retained, retry can succeed without duplicate records. | Browser/integration |
| TC-30 | NFR-04, NFR-05 | Complete core flow at three widths and by keyboard; labels/focus/errors remain usable. | Manual acceptance |
| TC-31 | NFR-06, NFR-09 | Record ten calculation timings and verify listener cleanup/no timer-tick writes. | Performance/review |
| TC-32 | NFR-08 | Another member follows README on a clean setup; type/lint/test/build results recorded. | Reproducibility |
| TC-33 | FR-13 | If CSV selected: correct own rows, delimiters/quotes/newlines and formula-safe text; no other user's data. | Unit/browser |
| TC-34 | FR-14 | If timer selected: pause/reset/hidden-tab behaviour and no per-tick network write. | Unit/browser |
| TC-35 | FR-15 | If dark mode selected: persist preference and verify readable labels/focus/warnings. | Manual |

### Golden boundary data

Use fixed `now = 2026-10-15 10:00:00 +02:00` in automated fixtures. Deadline 16 Oct 10:00 is exactly 24 h and bucket 1; 18 Oct 10:00 is exactly 72 h and bucket 2; 22 Oct 10:00 is exactly 168 h and bucket 3. Deadline equal to now is due-now, not overdue; one millisecond before is overdue. `2026-10-15 00:30 +02:00` equals `2026-10-14 22:30 Z`. These are expected fixtures for future execution, not current measurements.

## 6 Evaluation protocol

Plan for 3-5 consenting students, preferably beyond the authors, subject to supervisor/ethical requirements and actual availability. Use synthetic tasks and collect no grades or unnecessary identifying information. Record actual sample size and selection limits.

Tasks: create a subject/class, enter an assessment, identify the next recommended task and explain why, plan a study block, and interpret an overload warning. Record success/failure, completion time, assistance/errors and a short rating/open comment. If comparing with a plain task sheet, use matched tasks and balance the order where feasible to reduce learning effects. Report descriptive results and limitations; do not claim statistical/general academic improvement from a few participants.

Record protocol/version/date, consent/approval evidence where applicable, participant code, task outcomes, feedback, actual changes and retest. If participation is unavailable, disclose that and agree an evaluation adjustment; do not invent answers.

## 7 Exit criteria and evidence

Before the Week 4 recording: all accepted Must cases pass; permission/rules tests pass; no critical/high privacy or data-loss defect remains open; data survives reload; a clean demo flow works; every module has genuine owner commits and test evidence. Optional cases apply only if those features are accepted into scope.

For the supplied workbooks, map each FR/NFR to the design component, actual implementation reference, TC IDs, actual results and final status. Log genuine defects, fix commits and retests. Preserve expected versus actual results. Attach test environment, exact app revision, dataset and evidence paths. None of these final status/results fields has been completed by this planning document.

Technical test basis: [Firebase rules emulator documentation](https://firebase.google.com/docs/firestore/security/test-rules-emulator), [owner-based rules guidance](https://firebase.google.com/docs/rules/basics) and [field validation](https://firebase.google.com/docs/firestore/security/rules-fields), read 15 October 2026. Course evidence requirements come from the supplied SE2 briefs and workbook templates.
