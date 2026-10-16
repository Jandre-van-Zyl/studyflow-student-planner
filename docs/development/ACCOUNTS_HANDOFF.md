# Accounts/profile developer handoff

Implemented on Jandre's working branch, 16 October 2026. This handoff supports the other feature owners; it does not claim their modules or a Main merge are complete.

## Run and verify

Follow [SETUP.md](SETUP.md). Run npm ci, then npm run emulators in one terminal and npm run dev:emulator in another. Use a synthetic account at /account, then /settings. Defaults are seven zero-minute budgets. Profiles are stored in the disposable local Firestore emulator. Do not use actual portal passwords for tests.

Stop a manual emulator before npm run test:rules or npm run test:integration. npm run check is the frontend gate. Java 21+ is needed for backend tests. CI executes all three check commands.

## API contracts

| API/source                                                        | Contract                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [useAuth](../../src/features/auth/authContext.ts)                 | Current status, user (uid/email), profile, mode, error, register/signIn/signOut and profile retry |
| [AuthProvider](../../src/features/auth/AuthProvider.tsx)          | One observer for Auth, one profile listener, generation guards and session/profile recovery       |
| [AuthGate](../../src/features/auth/AuthGate.tsx)                  | Private routes render only when ready; layout-preview exception is explicit disabled mode         |
| [getFirebaseServices](../../src/lib/firebase/client.ts)           | Cached shared app/auth/database; never initialize another Firebase app in a feature               |
| [profileService](../../src/features/auth/profileService.ts)       | ensureProfile(uid,name), watchProfile(uid,next,fail), saveProfile(uid,input,expectedUpdatedAt)    |
| [profileValidation](../../src/features/auth/profileValidation.ts) | Weekday definitions, safe defaults, runtime validation and stored-profile parsing                 |
| [shared types](../../src/shared/types/planner.ts)                 | Current profile and proposed subject/class/assessment/block document contracts                    |

Statuses: disabled (layout preview), loading, signed-out, profile-loading, profile-error, ready and error. Profile-loading/error can have a user but no usable profile: use `status === 'ready'` before querying/rendering private feature data. Do not use a stale profile copied outside the authenticated tree.

AuthGate is already the parent of dashboard/subjects/assessments/planner/settings. Auth state survives a refresh in the same tab, not a closed tab. Logout clears private state immediately; if Firebase sign-out fails the workspace remains locked and retry is offered.

## Owner paths and module integration

- Profile: users/{uid}; already implemented. Store no duplicate UID/owner/password fields.
- Riaan: users/{uid}/subjects and users/{uid}/classSlots; add matching rules/tests with the actual forms/services.
- Dewald: users/{uid}/assessments; add schema/reference validation and tests with CRUD.
- Omphemetse: users/{uid}/studyBlocks; add interval/reference validation and tests with block operations.
- Aneesah: consume live feature datasets and useAuth().profile.studyBudgetMinutes. The profile listener updates this value after settings saves, so dependent calculations must react to it.

Only profiles are permitted by current rules. A permission-denied error on unfinished collections is expected, not a reason to open test-mode access. Coordinate changes to firebase/firestore.rules and run the full security suite. Schema/ERD/normalisation assessment acceptance remains a separate supervisor question.

Each owner detaches Firestore listeners in its hook/effect cleanup and depends on the current UID. AuthGate keys the feature tree by UID, but listener/service ownership still belongs to the feature. Do not keep private data in module globals. Surface loading, empty and failed states separately.

## Saves and recovery

Profile services reject a UID that differs from auth.currentUser.uid. A server-only read precedes each transaction. Creation is idempotent and never overwrites an existing profile. Updates compare the loaded updatedAt inside the transaction, preserve createdAt and set server updatedAt. Settings show success only after server confirmation. Another editor's changes require explicit reload; a failed response can be uncertain if the server committed before the acknowledgement was lost.

All seven budgets must be integer 0-1440. Zero means no planned study allocation for that day. This is a declared budget, not measured study time. Display name is trimmed, 1-80 characters and one line. Timezone is fixed for this release.

## Evidence and remaining integration

[Design/sequence/data dictionary](../design/Accounts_and_Profile_Design.md) and [executed verification](../testing/Jandre_Accounts_Verification_2026-10-16.md) are the source handoff. Other feature CRUD, dashboard recalculation, full collection ownership/schema acceptance, shared cloud integration and final course submissions remain outstanding. No CTU portal API or browser extension was implemented by this module.
