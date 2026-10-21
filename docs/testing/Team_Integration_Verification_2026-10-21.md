# Local team integration verification

21 October 2026, Africa/Johannesburg. Combines Jandre `5da02c3` and Aneesah `0259b42` on `integration/aneesah-dashboard-20261021`. Their histories are retained through merge `15feb44`. The latest user instruction is **do not push**. This record does not approve Main, PR merge, cloud deployment or course submission.

## Result and differences

Aneesah's corrected functions now drive live dashboard recommendations and the planner's shared allocation helper. The existing view adapters convert dates for calculations while preserving the original SAST display strings, object identity and revision fields. Duplicate ranking/allocation algorithms were removed. The dashboard now shows the 1-30 minute Quick task label and consumes the shared daily budget summary. The explanation uses Aneesah's wording, such as `Due within 72 hours - high priority`.

Jandre's admission checks, CTU identity, isolated cloud build and post-save confirmation correction are inherited from his earlier local commits. This integration does not change Firebase schemas, rules, approved students, package versions, hosting or the other members' work.

## Automated results

| Check                                    | Observed result                                                                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Focused RED tests before the adapter fix | 25 passed, 3 failed: equivalent-instant ordering, missing Quick task label, UTC-to-SAST daily allocation. Checkpoint `b912785`.     |
| Focused GREEN tests after integration    | 42 passed across the adapter/dashboard and both utility test files.                                                                 |
| `npm run check`                          | Formatting, TypeScript, 187 application tests and production build passed. ESLint: zero errors, one inherited AuthProvider warning. |
| `npm run test:rules`                     | 107 passed using the local Firestore emulator.                                                                                      |
| `npm run test:integration`               | 11 passed using real local Auth and Firestore emulators.                                                                            |
| `npm audit --omit=dev --json`            | Zero production dependency vulnerabilities reported. This does not clear development-tool advisories.                               |
| `git diff --check`                       | Passed.                                                                                                                             |

All 168 relative documentation and screenshot links were checked; none were missing.

Total automated tests in the full suites: **305**. Focused reruns are subsets, not additional tests. No coverage percentage or completion of all 35 planned capstone acceptance cases is claimed.

The first full run found an inherited test timing race: the settings confirmation text could appear before its focus effect. The test now waits for focus and still requires it. Product focus behaviour was not weakened. Aneesah's misnumbered recommendation test labels were also corrected without removing their assertions.

Runtime: Node 24.19.0, npm 11.17.0 and Java 21.0.8. Dependencies installed from the unchanged lockfile with install scripts disabled. The sandboxed first install failed resolving the registry; the authorized network retry succeeded. No package versions or global settings changed.

## Browser checks: actual emulator-backed records

An explicitly labelled disposable account was created, verified and approved only in loopback `demo-studyflow`. Initial planner fixtures were written through the normal authenticated Firebase client and current rules. No fixture script or account is added to normal startup. Tests never used Jandre's cloud account or production data.

1. Signed in and opened the saved planner. Two equally urgent High-priority assessments recommended the 15-minute item before the 120-minute item. The recommendation showed its Quick task label and 12:00 SAST deadline.
2. Edited that estimate from 15 to 45 in the real assessment form. Saved, navigated and refreshed: the value remained 45 and the Quick task label disappeared.
3. Confirmed Planned plus Done blocks totalled 90 minutes against a 60-minute budget; an already Cancelled block was excluded. Dashboard and weekly planner agreed on 30 minutes excess.
4. Cancelled the Planned block through the planner. After refresh, the Done block still counted as 45 minutes and both screens agreed. Dashboard showed 15 minutes available.
5. Saved Wednesday's budget as zero through Settings: 45 minutes overload, with a finite bar. Restored the budget to 60.
6. Created a new 20-minute High-priority assessment in the UI. After refresh it became the recommendation with the Quick task label, ahead of the otherwise tied 45- and 120-minute tasks.
7. Used the date control's keyboard navigation to select an empty day: zero allocated and zero budget remained neutral. Returned with Today. The automation's date-fill operation did not commit the native control; an actual keyboard change did, so a fill-only attempt is not counted as a passed date-selection check.
8. Inspected the narrow viewport: 375 CSS pixels of content within 375 available pixels, with no horizontal overflow. The label and workload display remained readable. Reset the viewport afterward.
9. Browser error log contained no errors at the end of these flows. Signed out, then opened `/dashboard`: the sign-in screen appeared and the private task was absent.

The local app and emulators were stopped after testing. Disposable accounts/data disappear with the emulator session. No real cloud email, membership, record or budget was changed.

## Screenshots

[Saved dashboard after creating the new task](screenshots/integration-2026-10-21/dashboard.jpg)

[Narrow-screen dashboard](screenshots/integration-2026-10-21/mobile.jpg)

[Saved zero-budget warning](screenshots/integration-2026-10-21/zero-budget.jpg)

These contain synthetic local data. Full checkpoint screenshots and command logs are retained in Jandre's Desktop planning execution folder for this integration.

## Remaining limits

- This candidate is local. Remote Main and the open PR are unchanged; no hosted CI result exists for the combined integration commit.
- Existing AuthProvider lint warning remains. No new auth implementation change was made to silence it.
- No live two-account cloud or second-device check was performed in this task. Local automated ownership/isolation tests passed.
- This is a verified integration candidate, not confirmation of lecturer acceptance, final dissertation, all group contributions or a completed capstone.

Read the [integration handoff](../development/DASHBOARD_INTEGRATION.md) for the code boundaries and [student-access guide](../development/STUDENT_ACCESS.md) for local verification/approval steps.
