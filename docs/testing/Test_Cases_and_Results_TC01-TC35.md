# Test Cases and Results — TC-01 to TC-35

**Project:** StudyFlow Student Planner  
**Contributor:** Omphemetse Dikeledi  
**Status:** All 35 test cases reported passed review by the contributor  
**Record date:** 26 October 2026

## Execution and attribution note

The contributor confirms that TC-01 through TC-35 were tested and passed review. The collaborative planner scenarios specifically documented in the existing execution record are mapped to the closest relevant formal cases below: OMP-PL-01 (create/reload), OMP-PL-03 (cancel), OMP-PL-04 (touching endpoints), OMP-PL-05 (cancelled block excluded), OMP-PL-06 (class boundary), and OMP-PL-07 (class-overlap confirmation and retest). The contributor reports completing the remaining cases personally. This mapping is based on the available execution notes and is not a claim that each formal TC identifier was written on the original screenshot or log.

“PASS — contributor-reported” means the contributor confirms the case passed. It does not imply independent re-execution by the assistant. Preserve the available evidence and add missing raw output where the team's template specifically requires it.

## Results

| Test ID | Requirement(s) | Test case / expected behaviour | Result | Evidence / note |
|---|---|---|---|---|
| TC-01 | FR-01 | Valid registration/login; invalid credentials handled with an appropriate error. | PASS — contributor-reported | Account/authentication flow reviewed; attach account test evidence if required. |
| TC-02 | FR-01; NFR-01 | Sign out from account A and sign in as B; A's data disappears and A's listeners detach. | PASS — contributor-reported | Keep account-switching evidence or automated test output with the final report. |
| TC-03 | NFR-01 | Unauthenticated reads/writes to protected paths are denied. | PASS — contributor-reported | Security-rule test evidence should identify the rules/emulator revision. |
| TC-04 | NFR-01 | Account A cannot read or write B's profile, subjects, classes, assessments, or blocks. | PASS — contributor-reported | Security-rule test evidence should identify the rules/emulator revision. |
| TC-05 | NFR-02 | Extra privilege/owner fields, invalid enum values, and malformed data types are rejected by rules/validation. | PASS — contributor-reported | Record the actual invalid payloads in the underlying test evidence where available. |
| TC-06 | FR-02 | Save all seven workload budgets, including zero; reload and verify values and workload update. | PASS — contributor-reported | Attach the values/results used during execution if the report template requires them. |
| TC-07 | FR-02 | Negative, fractional, missing-day, and over-1440-minute budgets are rejected. | PASS — contributor-reported | Validation result reported as passed. |
| TC-08 | FR-03 | Create, edit, and archive a subject; active choices update while existing related work remains visible. | PASS — contributor-reported | Validation result reported as passed. |
| TC-09 | FR-04 | Valid class appears only on its matching weekday and within its active date range. | PASS — contributor-reported | Validation result reported as passed. |
| TC-10 | FR-04; NFR-02 | Reversed class time/date or foreign/missing subject reference is rejected. | PASS — contributor-reported | Validation result reported as passed. |
| TC-11 | FR-05 | Assessment saves and retains exact subject, deadline, and effort after reload. | PASS — contributor-reported | Validation result reported as passed. |
| TC-12 | FR-05; NFR-02 | Blank title, invalid priority/type, negative effort, or foreign reference is rejected. | PASS — contributor-reported | Validation result reported as passed. |
| TC-13 | FR-06 | Completing an assessment sets zero effort and completedAt; reopening requires positive effort and clears completedAt. | PASS — contributor-reported | Validation result reported as passed. |
| TC-14 | FR-06; FR-09 | Assessment completion/archive retains block history and linked blocks show assessment state. | PASS — contributor-reported | Validation result reported as passed. |
| TC-15 | FR-07 | Subject/status/search filters apply to the user's own items, including empty and archive views. | PASS — contributor-reported | Validation result reported as passed. |
| TC-16 | FR-08; NFR-03 | A deadline at 00:30 SAST appears on the correct SAST date across UTC midnight. | PASS — contributor-reported | Record test date/time zone and output if required by the template. |
| TC-17 | FR-08 | Previous/current/next week navigation and mobile selected-day view combine events correctly. | PASS — contributor-reported | Validation result reported as passed. |
| TC-18 | FR-09 | A valid dated study block saves and persists; cancellation removes it from allocated workload. | PASS — contributor-reported | Collaborative planner test notes include create/reload and cancellation scenarios (OMP-PL-01 and OMP-PL-03). |
| TC-19 | FR-09; NFR-02 | Reversed/cross-midnight, under-15-minute, over-180-minute blocks or missing/foreign assessment references are rejected. | PASS — contributor-reported | Validation result reported as passed. |
| TC-20 | FR-09 | A future block cannot be marked Done before its start; eligible block state persists. | PASS — contributor-reported | Validation result reported as passed. |
| TC-21 | FR-10 | Class 09:00–10:00 and study block 09:30–10:15 show conflict; user can change time or explicitly confirm overlap. | PASS — contributor-reported; retest passed | Collaborative OMP-PL-07 retest passed after environment restart and test-data recreation. Initial confirmation attempt froze the app; root cause remains unconfirmed. |
| TC-22 | FR-10 | A block starting when a class ends does not warn; cancelled blocks do not cause overlap warnings. | PASS — contributor-reported | Collaborative OMP-PL-04, OMP-PL-05, and OMP-PL-06 cover touching endpoints, cancelled-block exclusion, and class boundary. |
| TC-23 | FR-11 | Completed/archived items are excluded; overdue items lead; stable ties follow published sort keys. | PASS — contributor-reported | Validation result reported as passed. |
| TC-24 | FR-11; NFR-03 | Exact 0/24/72/168-hour boundaries and one-millisecond either side behave as specified. | PASS — contributor-reported | Attach actual boundary values/results if required by the report template. |
| TC-25 | FR-11 | High/Medium/Low priorities sort within a bucket as documented; quick-task badge does not override ordering. | PASS — contributor-reported | Validation result reported as passed. |
| TC-26 | FR-12 | Two non-cancelled 45-minute blocks against a 60-minute budget show 90 allocated and 30 over budget. | PASS — contributor-reported | Validation result reported as passed. |
| TC-27 | FR-12 | Zero budget with no blocks is neutral; zero budget with a block warns without invalid arithmetic. | PASS — contributor-reported | Validation result reported as passed. |
| TC-28 | FR-12 | Done blocks count and Cancelled blocks do not; completed/overdue counts use the same time snapshot. | PASS — contributor-reported | Validation result reported as passed. |
| TC-29 | NFR-07 | Offline/denied write does not falsely show success; inputs remain and retry succeeds without duplicate. | PASS — contributor-reported | Validation result reported as passed. |
| TC-30 | NFR-04; NFR-05 | Core flow at three widths and keyboard use; labels, focus, and errors remain usable. | PASS — contributor-reported | Validation result reported as passed. |
| TC-31 | NFR-06; NFR-09 | Record ten calculation timings and verify listener cleanup/no timer-tick writes. | PASS — contributor-reported | The contributor reports a pass; include the ten actual timings and supporting listener/write evidence if the official template requires raw measurements. |
| TC-32 | NFR-08 | Another team member follows README clean setup; record type/lint/test/build outcomes. | PASS — contributor-reported | Previously reported automated check: Prettier, ESLint, TypeScript, 13 Vitest files/130 tests, and Vite build passed; rerun on final revision. |
| TC-33 | FR-13 (if CSV export in scope) | CSV export contains correct own rows, handles delimiters/quotes/newlines, protects formula-like text, and excludes other users' data. | PASS — contributor-reported | Keep in scope only if CSV export was included in the build reviewed by the team. |
| TC-34 | FR-14 (if timer in scope) | Timer pause/reset/hidden-tab behaviour works without per-tick network writes. | PASS — contributor-reported | Keep in scope only if the timer was included in the build reviewed by the team. |
| TC-35 | FR-15 (if dark mode in scope) | Dark-mode preference persists and labels, focus indicators, and warnings remain readable. | PASS — contributor-reported | Keep in scope only if dark mode was included in the build reviewed by the team. |

## Overall result

- **Cases reported passed:** 35 / 35
- **Cases reported failed:** 0
- **Outstanding documentation/evidence tasks:** preserve the OMP-PL-07 initial freeze and successful retest; rerun automated checks on the final revision; attach raw measurements/evidence where the official report requires it; confirm TC-33–TC-35 are within the final product scope.
