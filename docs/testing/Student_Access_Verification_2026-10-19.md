# Student access verification - 19 October 2026

Scope: verified email plus an administrator-owned approved-student list, applied to account admission and every private Firestore operation. Implemented on local jandre; cloud provider/database setup and deployment remain pending. This is not a completed-capstone or all-acceptance-cases claim.

## Test-first evidence

RED checkpoint `cce1450` contains the access contract and reproductions. Before implementation, the new account test failed because an unverified user reached profile loading (14 existing tests passed). The rules run had four new failures and 93 passes: unverified/unlisted/missing-claim access was allowed, while a verified user's own membership-status read was unsupported.

During review, a further regression test reproduced an unnecessary workspace remount on unchanged ID-token renewal (one failure, 21 passes). The final implementation preserves the admitted session on routine renewal while restarting the boundary for identity/email/verification changes. Explicit recheck still reloads the user, refreshes token claims and retries membership.

## Final executed checks

| Check                                                                    | Result                                                                                                                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                          | Passed formatting, ESLint, strict TypeScript, 166 app tests across 16 files and the default production build.                                                                           |
| `npm run test:rules`                                                     | 107 tests passed against the Firestore emulator.                                                                                                                                        |
| `npm run test:integration`                                               | 10 tests passed against Auth and Firestore emulators.                                                                                                                                   |
| `npm run demo:approve -- --help`                                         | Usage returned without connecting to a backend.                                                                                                                                         |
| Local approval helper, then `--revoke` for a disposable browser identity | Both succeeded; admission and revocation were visibly observed.                                                                                                                         |
| `git diff --check` and targeted source scan                              | Passed; no private keys/service-account secrets or Jandre's real student address in the changed source, rules, documentation or scripts. CLI console output is limited to usage/status. |

This is 283 automated tests, not 283 independent user acceptance cases. Coverage instrumentation was not added or measured; no percentage is claimed. Dependency versions and package-lock are unchanged.

## Browser evidence

After the final checks, `npm run build:cloud` also passed with the existing issued public configuration. This refreshed the local release bundle only; no cloud service or Hosting release was changed.

Verified in the existing Opera browser against `npm run dev` and its disposable local backend, using a synthetic `example.test` identity:

1. Registration opened **Verify your student email**, with no private navigation/profile access.
2. Explicit send showed success and disabled duplicate sends with the resend cooldown. The local emulator verification link confirmed verification.
3. Recheck showed **Student approval needed** while the verified address was unlisted.
4. Explicit local approval opened the correct profile automatically and preserved the entered display name.
5. Settings saved a 60-minute Monday budget. Browser refresh restored the approved session and the saved budget.
6. Local deactivation immediately removed private navigation and returned Settings to the approval screen. Opening `/planner` directly also returned to `/account`.
7. Sign out returned to the blank sign-in form. Temporary app and emulator processes were stopped; their listening ports were checked afterward.

Four screenshots are retained in Jandre's private planning execution evidence: verification required, approval required, admitted profile and revoked access. A browser control read timed out once; screenshot/state recovery succeeded. One transient Firestore transport warning appeared during that interval, followed by successful admission/save/refresh. No claim of a warning-free browser session is made.

## Security and compatibility

- Direct rule tests cover missing/false verification, missing/inactive/malformed approval, unsupported token emails, normalized email matching, own-only membership reads, list/write/delete denial and all private planner paths after revocation. Foreign-owner tests use a separately approved verified identity so membership failure cannot mask ownership failure.
- Existing profile/planner schema, ownership, reference, timestamp, revision and subject-code checks remain. Integration follows real local verification action codes and refreshed tokens before profile creation, then proves direct access fails after deactivation.
- App tests cover cache-only approval, membership failure/timeout/revocation, old UID callbacks, sign-out during recheck, profile retry bypass prevention, recovery controls and routine token renewal. No emulator bypass or blanket domain approval exists.
- Previously created accounts must verify email and receive a genuine approved-list entry before accessing retained data. Requiring admission is an intentional access-policy change; it does not delete data or block creation of a bare Firebase Auth identity.

No real email, cloud account, administrator access, billing, remote branch or deployed app/rules was changed during this task. Team approval does not independently establish CTU enrolment. Rebuild and review the matching app/rules together before any authorized rollout. Read [student access setup](../development/STUDENT_ACCESS.md) and the [contract](../design/Student_Access_Contract.md).
