# Chapter 5 — Testing Results and Evaluation

## 5.1 Testing approach

StudyFlow was reviewed using the project test cases TC-01 through TC-35. The cases cover account isolation, input validation, subjects, classes, assessments, calendar behaviour, study blocks, overlap handling, workload summaries, error handling, responsive and keyboard use, performance/listener behaviour, setup reproducibility, and selected optional features.

The contributor confirms that all 35 cases were tested and passed review. The collaborative planner tests documented in the execution notes include study-block creation and persistence, cancellation, adjacent time boundaries, cancelled-block exclusion, class-boundary behaviour, and class-overlap confirmation. The contributor reports personally completing the remaining test cases. The test register records each case as **PASS — contributor-reported**.

This chapter presents the contributor's reported results. It does not claim that the assistant independently executed all cases or observed all test sessions.

## 5.2 Results summary

| Measure | Result |
|---|---|
| Formal test cases in register | 35 |
| Cases reported passed | 35 |
| Cases reported failed | 0 |
| Cases reported blocked at final retest | 0 |
| Recorded intermittent observation | Initial app freeze during class-overlap confirmation; successful retest after restarting local environment and recreating test data |

The “zero failed” summary reflects the contributor's final reported review status. It must not be interpreted as erasing the initial freeze observation, which is retained in the defect log and test register.


## 5.3 Detailed test results: TC-01 to TC-35

The following table summarises the 35 test cases in the StudyFlow test register. The contributor reports that all 35 cases were tested and passed review. Individual results are therefore recorded as contributor-reported unless a specific observation or supporting artefact is documented in the planner execution record.

| Test ID | Requirement area                                     | Test objective                                                                                                                                                                          | Reported result                                                                                      |
| ------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| TC-01   | FR-01 — Account access                               | Verify valid registration and login, and appropriate handling of invalid credentials.                                                                                                   | PASS — contributor-reported                                                                          |
| TC-02   | FR-01, NFR-01 — Account isolation                    | Sign out from one account, sign in with another, and verify that the previous account's data is no longer displayed and its listeners are detached.                                     | PASS — contributor-reported                                                                          |
| TC-03   | NFR-01 — Access control                              | Verify that unauthenticated access to protected data is denied.                                                                                                                         | PASS — contributor-reported                                                                          |
| TC-04   | NFR-01 — User data privacy                           | Verify that one account cannot read or modify another account's profile, subjects, classes, assessments, or study blocks.                                                               | PASS — contributor-reported                                                                          |
| TC-05   | NFR-02 — Data validation and security rules          | Verify that unauthorised fields, invalid enumerated values, and malformed data are rejected.                                                                                            | PASS — contributor-reported                                                                          |
| TC-06   | FR-02 — Study-time budgets                           | Save study-time budgets, including zero values, reload them, and verify that the workload summary reflects them.                                                                        | PASS — contributor-reported                                                                          |
| TC-07   | FR-02, NFR-02 — Budget validation                    | Verify that negative, fractional, missing-day, and greater-than-1,440-minute budget values are rejected.                                                                                | PASS — contributor-reported                                                                          |
| TC-08   | FR-03 — Subject management                           | Create, edit, and archive a subject; verify that active subject choices update and existing related work remains visible.                                                               | PASS — contributor-reported                                                                          |
| TC-09   | FR-04 — Class scheduling                             | Verify that a valid class appears on the correct weekday and only within its active date range.                                                                                         | PASS — contributor-reported                                                                          |
| TC-10   | FR-04, NFR-02 — Class validation                     | Verify rejection of reversed class times or dates and missing or foreign subject references.                                                                                            | PASS — contributor-reported                                                                          |
| TC-11   | FR-05 — Assessment management                        | Create an assessment and verify that its subject, deadline, and estimated effort persist after reloading.                                                                               | PASS — contributor-reported                                                                          |
| TC-12   | FR-05, NFR-02 — Assessment validation                | Verify that blank titles, invalid priority or type values, negative effort, and foreign references are rejected.                                                                        | PASS — contributor-reported                                                                          |
| TC-13   | FR-06 — Assessment completion                        | Mark an assessment complete and verify zero remaining effort and a completion timestamp; reopen it and verify that positive effort is required and the completion timestamp is cleared. | PASS — contributor-reported                                                                          |
| TC-14   | FR-06, FR-09 — Assessment history                    | Verify that completing or archiving an assessment retains its related study-block history and displays the relevant assessment state.                                                   | PASS — contributor-reported                                                                          |
| TC-15   | FR-07 — Search and filtering                         | Verify subject, status, and search filters, including empty results and archive views.                                                                                                  | PASS — contributor-reported                                                                          |
| TC-16   | FR-08, NFR-03 — Time-zone boundaries                 | Verify that a deadline at 00:30 South African Standard Time appears on the correct SAST date across the UTC date boundary.                                                              | PASS — contributor-reported                                                                          |
| TC-17   | FR-08 — Calendar navigation                          | Verify previous, current, and next-week navigation and the combination of calendar events on the selected mobile day.                                                                   | PASS — contributor-reported                                                                          |
| TC-18   | FR-09 — Study-block management                       | Create a dated study block, save it, reload the planner, and verify persistence; cancel a block and verify that it is removed from allocated workload.                                  | PASS — contributor-reported; related manual observations are recorded in OMP-PL-01 and OMP-PL-03     |
| TC-19   | FR-09, NFR-02 — Study-block validation               | Verify rejection of reversed or cross-midnight times, durations below 15 or above 180 minutes, and missing or foreign assessment references.                                            | PASS — contributor-reported                                                                          |
| TC-20   | FR-09 — Study-block state                            | Verify that a future block cannot be marked Done before its start time and that eligible state changes persist.                                                                         | PASS — contributor-reported                                                                          |
| TC-21   | FR-10 — Overlap handling                             | Verify that a study block overlapping a class triggers a warning and that the user can change the time or explicitly confirm the overlap.                                               | PASS — contributor-reported; see OMP-PL-02 and OMP-PL-07, including the recorded intermittent freeze |
| TC-22   | FR-10 — Overlap boundaries                           | Verify that blocks whose endpoints touch are not treated as overlapping and that cancelled blocks are excluded from overlap warnings.                                                   | PASS — contributor-reported; related observations are recorded in OMP-PL-04 and OMP-PL-05            |
| TC-23   | FR-11 — Planner ordering                             | Verify that completed and archived items are excluded, overdue items are prioritised, and ties follow the documented ordering rules.                                                    | PASS — contributor-reported                                                                          |
| TC-24   | FR-11, NFR-03 — Deadline boundaries                  | Verify exact 0-, 24-, 72-, and 168-hour boundaries, including values immediately before and after each boundary.                                                                        | PASS — contributor-reported                                                                          |
| TC-25   | FR-11 — Priority ordering                            | Verify documented High, Medium, and Low ordering within a priority bucket and that quick-task indicators do not override the intended order.                                            | PASS — contributor-reported                                                                          |
| TC-26   | FR-12 — Workload allocation                          | Verify that two non-cancelled 45-minute blocks against a 60-minute budget produce 90 allocated minutes and a 30-minute excess.                                                          | PASS — contributor-reported                                                                          |
| TC-27   | FR-12 — Zero-budget handling                         | Verify that a zero budget without study blocks produces a neutral result and that a zero budget with allocated time displays an appropriate warning without invalid arithmetic.         | PASS — contributor-reported                                                                          |
| TC-28   | FR-12 — Workload state consistency                   | Verify that Done blocks count toward workload while Cancelled blocks do not, and that completion and overdue counts use a consistent time snapshot.                                     | PASS — contributor-reported                                                                          |
| TC-29   | NFR-07 — Error and retry handling                    | Simulate an offline or denied write and verify that the application does not report false success, retains input, and retries without creating a duplicate.                             | PASS — contributor-reported                                                                          |
| TC-30   | NFR-04, NFR-05 — Responsive and keyboard usability   | Check core workflows at three viewport widths and verify keyboard navigation, labels, focus, and error feedback.                                                                        | PASS — contributor-reported                                                                          |
| TC-31   | NFR-06, NFR-09 — Performance and listener efficiency | Record ten calculation timings and verify listener cleanup and the absence of timer-tick writes.                                                                                        | PASS — contributor-reported; attach actual measurements and supporting evidence if required          |
| TC-32   | NFR-08 — Reproducible setup                          | Have another team member follow the README setup and record type-check, lint, test, and build outcomes.                                                                                 | PASS — contributor-reported; rerun automated checks on the final revision                            |
| TC-33   | FR-13 — CSV export, if in scope                      | Verify correct user-owned rows, delimiter and quoting behaviour, newline handling, formula-safe text, and exclusion of other users' data.                                               | PASS — contributor-reported; confirm feature is included in the reviewed build                       |
| TC-34   | FR-14 — Study timer, if in scope                     | Verify timer pause, reset, hidden-tab behaviour, and the absence of per-tick network writes.                                                                                            | PASS — contributor-reported; confirm feature is included in the reviewed build                       |
| TC-35   | FR-15 — Dark mode, if in scope                       | Verify that the preference persists and that labels, focus indicators, and warnings remain readable.                                                                                    | PASS — contributor-reported; confirm feature is included in the reviewed build                       |

### Interpretation of the test results

The contributor reports 35 passed test cases and zero cases reported as failed in the final review. This is a summary of the reported results, not independent confirmation that every test was executed successfully.

Detailed manual observations are available for the planner scenarios OMP-PL-01 to OMP-PL-07. In particular, OMP-PL-07 records an initial application freeze during overlap confirmation followed by a successful retest. The successful retest does not establish the root cause or prove that the freeze cannot recur.

The broader test register documents the intended coverage of account isolation, validation, scheduling, assessment management, workload calculations, usability, performance, and setup reproducibility. Where raw logs, screenshots, timing measurements, or other per-case evidence are unavailable, the results should remain identified as contributor-reported.

Before final submission, rerun automated checks on the final revision, record the tested Git commit, attach required evidence, and confirm that TC-33 to TC-35 correspond to features included in the reviewed build.

## 5.4 Automated verification

A previous `npm.cmd run check` run was reported to have passed:
- Prettier formatting check
- ESLint
- TypeScript checks
- Vitest: 13 test files / 130 tests
- Vite production build

These are historical results and should be rerun against the exact final submission revision. Record the date, branch, commit SHA, commands, and final output. Do not run Firebase emulator integration/rules scripts while another process is using the same emulator ports without first checking the active environment.

## 5.5 Evaluation

The reported results indicate that the tested workflows behaved as expected in the contributor's review. The planner scenarios provide evidence for persistence, cancellation, time-boundary handling, and explicit overlap confirmation. The broader test register covers account privacy, validation, workload calculations, responsive behaviour, error handling, and reproducibility.

The strongest documented qualification is the initial freeze during class-overlap confirmation. The successful retest is positive evidence that the workflow subsequently completed, but it does not establish the cause of the earlier freeze or prove that it can never recur.

For performance-related TC-31, include the ten actual calculation timing values and listener/no-timer-write evidence if those measurements are required by the official assessment rubric. For TC-32, include clean-setup instructions and fresh final-revision check output. TC-33 through TC-35 should only be represented as delivered product scope if CSV export, the timer, and dark mode were part of the build that was reviewed.

## 5.6 Limitations

- Most formal TC-01–TC-35 results are based on the contributor's report; detailed per-case screenshots or raw logs were not provided for every case.
- The assistant did not independently re-execute the full suite.
- The known initial freeze has no confirmed root cause.
- Automated check results must be refreshed for the final revision.
- No claim is made here of production deployment, formal institutional approval, external penetration testing, or a statistically designed usability study.

## 5.7 Conclusion

The contributor reports that all 35 test cases passed review. The documented planner tests include a successful class-boundary scenario and a successful class-overlap retest, with the earlier freeze retained as a known observation. Before submission, align this chapter with the official report template, attach the available evidence, refresh automated checks on the final commit, and ensure all optional features and claims match the actual reviewed build.
