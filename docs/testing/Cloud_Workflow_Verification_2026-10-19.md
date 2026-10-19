# Cloud workflow and save-confirmation verification

19 October 2026, Africa/Johannesburg. Backend: `studyflow-ctu-capstone`, Spark, default Standard Firestore in Johannesburg. Frontend: local `preview:cloud` at port4173. This is not a public Hosting release or a completed multi-account cloud security test.

## Actual account and linked workflow

Jandre entered his own password, received the verification email and completed the verification link. Check access again admitted the exact approved account, initialized its profile and opened the private dashboard. A full reload retained admission and the saved planner view. No credential, email action link or authentication token was recorded.

Jandre separately approved labelled synthetic cloud records and their archival/cancellation after testing:

| Record      | Values and observed result                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subject     | Cloud test — Software Engineering, code CLOUD-SE2; server save confirmed.                                                                                             |
| Class       | Monday09:00–10:00 SAST,19–25October; synthetic location label; server save confirmed.                                                                                 |
| Assignment  | Cloud test — Sample assignment,23October12:00 SAST,60minutes remaining, To Do; server save confirmed. This is a synthetic deadline, not a revised course deadline.    |
| Study block | Cloud test — Draft sample outline,19October16:00–16:30 SAST, linked to that assignment; server save confirmed.                                                        |
| Budget      | Monday temporarily60minutes; other six days0. After full reload the weekly planner showed the class, deadline, block and30/60minutes.                                 |
| Cleanup     | Block Cancelled; assignment, class and subject archived; all seven budgets restored to0 and confirmed after reload. History is retained; nothing permanently deleted. |

Screenshots are retained privately under the project planning execution folder. They omit the account email and any credential. No additional student or administrator was approved.

## Defect found and fixed

The initial cloud budget save committed successfully, but the immediate confirmation returned the preceding profile view while the profile listener was active. The form displayed the old budget and then treated the newer listener revision as a change from another session. Explicit reload showed the correct saved budget. The same stale confirmation pattern existed in planner record saves.

The fix keeps validation, owner checks, the server-only offline preflight and revision-aware write transaction. It reads the committed result in a separate read-only transaction, independently of the active listener view. It retains schema parsing and the post-confirmation UID check. No rule, dependency, schema, account permission or billing setting changed.

Evidence follows ECC's test-first workflow. Journeys were derived from the observed cloud defect: saving must return the committed value/revision, and a budget save must not falsely claim another session changed it.

| Check                      | Actual result                                                                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RED `ddecb15`              | Focused service tests executed:2 failures,10 passes. Profile returned0 instead of60; planner returned the previous name instead of Updated subject.                                       |
| GREEN `e203a8d`            | Same focused target:12passes.                                                                                                                                                             |
| `npm run check`            | Format/types/build passed;168app tests across17files passed. ESLint:0errors,1pre-existing exhaustive-deps warning in AuthProvider cleanup.                                                |
| `npm run test:integration` | 11passes against disposable Auth/Firestore emulators. Includes a save with an active profile listener; emulator timing alone did not reproduce the original cloud failure before the fix. |
| `npm run build:cloud`      | Passed using the actual issued public web configuration.                                                                                                                                  |
| Real cloud retest          | Rebuilt bundle: Monday0→60→0 displayed each confirmed value immediately, without the false conflict/reload warning. Full reload confirmed0.                                               |
| Diff review                | Only confirmation reads, matching fixtures and regression tests changed in the fix sequence; no rule/schema/dependency change.                                                            |

Coverage percentage was not measured; no coverage dependency or threshold claim was added. The107-rule-test result belongs to the preceding unchanged rules checkpoint, not a new run for this service-only fix. No GitHub push, PR, Main merge or Hosting deployment occurred.

## Remaining checks

Real second-account ownership denial, teammate/marker access, public HTTPS release, another-device testing and final group acceptance remain outstanding. Never substitute a signed-out frontend redirect or emulator result for a completed live cross-account test.

Primary references consulted: [Firestore JS API](https://firebase.google.com/docs/reference/js/firestore), [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions) and the [Firebase SDK listener/transaction implementation](https://github.com/firebase/firebase-js-sdk/blob/main/packages/firestore/src/core/firestore_client.ts). The listener-reuse explanation is based on the observed old/new values and SDK implementation; it is not a claim that all Firestore reads are eventually consistent.
