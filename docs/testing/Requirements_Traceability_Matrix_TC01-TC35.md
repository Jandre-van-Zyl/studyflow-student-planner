# Requirements Traceability Matrix — TC-01 to TC-35

> Release reconciliation, 28 October: contributor-reported results below retain their attribution. They are not independent verification of the final build. TC-33 (CSV export) and TC-35 (dark mode) are not applicable to implemented scope; those features are absent. Use [the final release record](Final_Release_2026-10-28.md) for current checks and outstanding manual evidence.

**Status:** Coverage mapping based on the requirements and test-case descriptions supplied for StudyFlow. All linked test cases are reported as passed by the contributor.

| Requirement | Requirement area                                         | Covering test cases               | Result status                                                            |
| ----------- | -------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------ |
| FR-01       | Account registration, login, sign-out/account separation | TC-01, TC-02                      | PASS — contributor-reported                                              |
| FR-02       | Weekly study-time budgets and validation                 | TC-06, TC-07                      | PASS — contributor-reported                                              |
| FR-03       | Subject lifecycle and related-work visibility            | TC-08                             | PASS — contributor-reported                                              |
| FR-04       | Class scheduling, active dates, and subject references   | TC-09, TC-10                      | PASS — contributor-reported                                              |
| FR-05       | Assessment creation and validation                       | TC-11, TC-12                      | PASS — contributor-reported                                              |
| FR-06       | Assessment completion/reopening and history              | TC-13, TC-14                      | PASS — contributor-reported                                              |
| FR-07       | Search, status, subject, empty, and archive views        | TC-15                             | PASS — contributor-reported                                              |
| FR-08       | Calendar dates, week navigation, and time-zone handling  | TC-16, TC-17                      | PASS — contributor-reported                                              |
| FR-09       | Study-block creation, validation, and state              | TC-14, TC-18, TC-19, TC-20        | PASS — contributor-reported                                              |
| FR-10       | Class/block overlap handling and boundary conditions     | TC-21, TC-22                      | PASS — contributor-reported; TC-21 initial freeze retained as a note     |
| FR-11       | Prioritisation and time-boundary sorting                 | TC-23, TC-24, TC-25               | PASS — contributor-reported                                              |
| FR-12       | Workload allocation and workload summary                 | TC-26, TC-27, TC-28               | PASS — contributor-reported                                              |
| FR-13       | CSV export (if selected/in scope)                        | TC-33                             | PASS — contributor-reported; confirm scope                               |
| FR-14       | Study timer (if selected/in scope)                       | TC-34                             | PASS — contributor-reported; confirm scope                               |
| FR-15       | Dark mode (if selected/in scope)                         | TC-35                             | PASS — contributor-reported; confirm scope                               |
| NFR-01      | Authentication boundaries and private data               | TC-02, TC-03, TC-04               | PASS — contributor-reported                                              |
| NFR-02      | Data validation and rules enforcement                    | TC-05, TC-10, TC-12, TC-19        | PASS — contributor-reported                                              |
| NFR-03      | Date/time and deadline boundary correctness              | TC-16, TC-24                      | PASS — contributor-reported                                              |
| NFR-04      | Responsive usability                                     | TC-30                             | PASS — contributor-reported                                              |
| NFR-05      | Keyboard accessibility and usable feedback               | TC-30, TC-35 (if in scope)        | PASS — contributor-reported                                              |
| NFR-06      | Calculation performance                                  | TC-31                             | PASS — contributor-reported; attach actual ten timing values if required |
| NFR-07      | Offline/failed-write handling                            | TC-29                             | PASS — contributor-reported                                              |
| NFR-08      | Reproducible setup                                       | TC-32                             | PASS — contributor-reported; rerun checks on final revision              |
| NFR-09      | Listener/write efficiency                                | TC-02, TC-31, TC-34 (if in scope) | PASS — contributor-reported                                              |

## Traceability statement

The matrix links the supplied requirement identifiers to the supplied test cases. It demonstrates documented test coverage, not proof of production readiness or independent security certification. Any requirement numbering in the official specification takes precedence over this working mapping.
