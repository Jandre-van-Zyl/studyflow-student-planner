# Accounts/profile developer handoff

**Reconciled 19 October:** includes the existing startup/planner corrections and verified student access at local `7e3b7b5`. Shared `044eefc` was published to Main/member branches on 16 October; later local work is not newly published by this document. Read [STUDENT_ACCESS.md](STUDENT_ACCESS.md), [current cloud status](CLOUD_PROJECT_STATUS.md) and the [planner contract](../design/Planner_Data_Contract.md). Actual cloud mailbox/persistence checks and a public website remain separate from configured services.

The original module was implemented on Jandre's working branch on 16 October 2026. This current handoff supports integration with the other feature owners; each member's genuine contribution and review remain separately recorded.

## Run and verify

Follow [SETUP.md](SETUP.md). Run npm ci, then npm run dev in one terminal; it starts Auth/Firestore and opens /account. Ctrl+C stops the app and backend together. Do not start another emulator alongside it. Register a synthetic account at /account, explicitly request/open its emulator verification link, click Check access again, and approve that exact address in a second terminal with `npm run demo:approve -- student@example.test`. Follow [the complete access steps](STUDENT_ACCESS.md); then use /settings. No account is seeded or auto-approved. Defaults are seven zero-minute budgets. Profiles are stored in the disposable local Firestore emulator. Do not use actual portal passwords for tests.

Stop a manual emulator before npm run test:rules or npm run test:integration. npm run check is the frontend gate. Java 21+ is needed for backend tests. CI executes all three check commands.

## API contracts

| API/source                                                        | Contract                                                                                                                            |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [useAuth](../../src/features/auth/authContext.ts)                 | Status, user (uid/email/emailVerified), profile, mode, errors, account/profile actions, explicit sendVerification and recheckAccess |
| [AuthProvider](../../src/features/auth/AuthProvider.tsx)          | Token observer, admission/membership listener and admitted profile listener; generation guards and recovery                         |
| [AuthGate](../../src/features/auth/AuthGate.tsx)                  | Private routes render only when ready; layout-preview exception is explicit disabled mode                                           |
| [getFirebaseServices](../../src/lib/firebase/client.ts)           | Cached shared app/auth/database; never initialize another Firebase app in a feature                                                 |
| [profileService](../../src/features/auth/profileService.ts)       | ensureProfile(uid,name), watchProfile(uid,next,fail), saveProfile(uid,input,expectedUpdatedAt)                                      |
| [profileValidation](../../src/features/auth/profileValidation.ts) | Weekday definitions, safe defaults, runtime validation and stored-profile parsing                                                   |
| [shared types](../../src/shared/types/planner.ts)                 | Persisted profile/subject/class/assessment/block document contracts                                                                 |

Statuses: disabled (layout preview), loading, signed-out, verification-required, membership-loading, membership-denied, membership-error, profile-loading, profile-error, ready and error. Verification/membership/profile-loading/error states can have an Auth user but no usable private profile: use `status === 'ready'` before querying/rendering private feature data. Do not use a stale profile copied outside the authenticated tree.

AuthGate is already the parent of dashboard/subjects/assessments/planner/settings. Auth state survives a refresh in the same tab, not a closed tab. Logout clears private state immediately; if Firebase sign-out fails the workspace remains locked and retry is offered.

## Owner paths and module integration

- Profile: users/{uid}; already implemented. Store no duplicate UID/owner/password fields.
- Riaan: users/{uid}/subjects and users/{uid}/classSlots; use the existing shared planner services, rules and tests; extend them only for an agreed change.
- Dewald: users/{uid}/assessments; preserve existing schema/reference validation, services and tests when changing CRUD.
- Omphemetse: users/{uid}/studyBlocks; preserve existing interval/reference validation, services and tests when changing block operations.
- Aneesah: consume live feature datasets and useAuth().profile.studyBudgetMinutes. The profile listener updates this value after settings saves, so dependent calculations must react to it.

Current rules require a verified email and active administrator-owned `approvedStudents/{normalizedEmail}` entry, then permit only valid owner-scoped profiles/planner records, including code claims. Students cannot modify or list approval entries; verification alone and matching email domains are insufficient. A permission denial requires checking UID, schema, reference and lifecycle constraints; never open test-mode access to bypass it. Coordinate changes to firebase/firestore.rules and run the full security suite. Schema/ERD/normalisation assessment acceptance remains a separate supervisor question.

Each owner detaches Firestore listeners in its hook/effect cleanup and depends on the current UID. AuthGate keys the feature tree by UID, but listener/service ownership still belongs to the feature. Do not keep private data in module globals. Surface loading, empty and failed states separately.

## Saves and recovery

Profile services reject a UID that differs from auth.currentUser.uid. A server-only read precedes each transaction. Creation is idempotent and never overwrites an existing profile. Updates compare the loaded updatedAt inside the transaction, preserve createdAt and set server updatedAt. Settings show success only after server confirmation. Another editor's changes require explicit reload; a failed response can be uncertain if the server committed before the acknowledgement was lost.

All seven budgets must be integer 0-1440. Zero means no planned study allocation for that day. This is a declared budget, not measured study time. Display name is trimmed, 1-80 characters and one line. Timezone is fixed for this release.

## Admission and recovery contract

Reuse [membership types](../../src/shared/types/membership.ts), [runtime contract](../../src/features/auth/membershipContract.ts) and [membership listener](../../src/features/auth/membershipService.ts). Do not implement a separate email suffix gate in a feature. Membership uses server-confirmed snapshots and remains attached after admission. Revocation/failure clears private UI and profile/planner subscriptions; cached-only approval cannot open data. Routine unchanged token renewal preserves ready feature state; changed UID/email/verification re-enters admission. `retryProfile` cannot bypass membership. No real address belongs in fixtures or shared screenshots.

## Evidence and remaining integration

[Design/sequence/data dictionary](../design/Accounts_and_Profile_Design.md), [original 16 October verification](../testing/Jandre_Accounts_Verification_2026-10-16.md) and [19 October access verification](../testing/Student_Access_Verification_2026-10-19.md) are the source handoff. The current access checkpoint passed 166 app, 107 rules and 10 integration tests plus builds/browser checks; these are not all 35 capstone acceptance cases. Feature CRUD, dashboard recalculation and collection rules are implemented in the shared baseline. Final-version acceptance records, supervisor schema/ERD acceptance, independent second-machine setup, agreed app access and final course submissions remain outstanding or unverified. No CTU portal API, browser extension or facilitator workspace was implemented.
