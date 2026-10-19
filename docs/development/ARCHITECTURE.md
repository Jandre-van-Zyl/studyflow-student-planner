# Application and persistence architecture

Actual implementation through local `7e3b7b5`, reconciled 19 October 2026; shared published baseline remains `044eefc`. Product plans under docs/planning preserve the proposed baseline; Git/PR history identifies the integrated version.

The root is one Vite app: index.html -> src/main.tsx -> BrowserRouter -> app/App.tsx -> AuthProvider -> AppShell/routes. Tailwind compiles through Vite. There is no custom API server.

| Path                     | Responsibility                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| src/app                  | Route composition and layout-preview tests                                                                     |
| src/features/auth        | Registration/sign-in/out, verified-email/approved-list admission, session lifecycle, profiles and route guards |
| src/features/settings    | Seven-day budget/profile editor, dirty state and concurrent-edit recovery                                      |
| src/features/subjects    | Persistent subject/class forms and archive/restore                                                             |
| src/features/assessments | Persistent assessments, completion/reopening, filtering and validation                                         |
| src/features/planner     | Shared storage contract/service/workspace, week/day blocks and advisory clashes                                |
| src/features/dashboard   | Live agenda, explained priority, allocation and completion calculations                                        |
| src/shared               | Reusable shell/forms, icons and persisted document types                                                       |
| src/lib/firebase         | Explicit configuration modes and cached SDK singleton                                                          |
| src/test                 | Test setup and synthetic fixtures, not production user records                                                 |
| firebase                 | Profile/planner schemas, ownership/reference rules and real backend tests                                      |

## Shared contracts

`users/{uid}` is the profile. Implemented subcollections are subjects, classSlots, assessments and studyBlocks; subjectCodes holds atomic uniqueness claims. Document IDs come from snapshots; there is no editable owner field. One UID-scoped workspace subscribes to four collections through the existing Firebase singleton. Shared types, runtime adapters and rules jointly enforce [contract v1](../design/Planner_Data_Contract.md).

Assessment states: To Do/In Progress/Completed. Priorities: High/Medium/Low. Block states: Planned/Done/Cancelled. Class times are local HH:mm with inclusive YYYY-MM-DD ranges. Instants are Firestore Timestamp; display timezone is Africa/Johannesburg. Each calculation must take an explicit clock and remain independent of React/Firebase.

`approvedStudents/{normalizedEmail}` is a separate administrator-owned collection with exactly Boolean `active`. The token's verified email determines the membership lookup; profile fields cannot grant access. Students cannot write/list entries. [Membership types](../../src/shared/types/membership.ts), the [runtime contract](../../src/features/auth/membershipContract.ts) and [access contract](../design/Student_Access_Contract.md) define the boundary. It is authorization metadata, not a new child entity or stored SQL foreign key.

## Session and profile boundary

`useAuth` exposes current user/profile, status and account actions. `AuthGate` waits for verified email, server-confirmed active approval and a confirmed valid profile before private routes render; disabled mode alone uses the in-memory preview. Workspace/forms are keyed by UID/status. Sign-out immediately clears private UI and detaches listeners. Planner loading waits for all four confirmed server snapshots, ignores pending/cache snapshots and guards late callbacks by UID/lifecycle. Same-owner listener errors hide/inert the retained view and suspend dialogs until explicit retry; an auth/UID change unmounts everything immediately.

The membership listener remains attached after admission; revocation/failure unmounts private features, and cached-only approval cannot unlock them. Recheck reloads the current Auth user and forces fresh token claims. Routine unchanged token renewal preserves drafts; identity/email/verification changes clear/recheck admission. Profile retry cannot bypass this boundary.

Profile creation and stable-ID planner creation retries are idempotent. Transactions compare captured revisions, preserve createdAt and set server updatedAt. A server-only preflight respects offline mode; transaction reads enforce consistency. Failed writes retain drafts; conflicts require explicit reload/reopening. Dashboard uses live planner state plus reactive profile budgets. No planner browser storage or persistent Firestore disk cache is enabled.

## Backend and checks

npm run dev starts local Auth/Firestore and Vite, forces demo-studyflow and opens /account; Ctrl+C stops them. dev:emulator is the frontend-only option for an already running local backend. Disabled dev:preview mode needs no account. Project/web app, Email/Password policy, Johannesburg Standard database and reviewed rule publication are configured with explicit approval; actual verified cloud workflow/persistence and Hosting remain to be tested/published as recorded in [cloud status](CLOUD_PROJECT_STATUS.md). Build:cloud/preview:cloud use isolated dist-cloud; no default dev command selects cloud. Rules require verified active membership and strictly valid own profile/planner access; unknown paths and foreign access are denied. Business-record hard deletes are denied; the narrow exception removes an old subjectCodes claim during an atomic code rename. SDK chunk ordering and strictExecutionOrder are preserved.

Core checks cover formatting/lint/types/unit-UI tests/build. Rules tests exercise ownership, exact schemas, references, metadata, completion and unique claims. Integration tests use real local Auth/Firestore with actual profile/planner services. CI runs all three commands. The 19 October access checkpoint passed 166 app, 107 rules and 10 integration tests; later final candidates need their own results. Read the [student access guide](STUDENT_ACCESS.md), [access verification](../testing/Student_Access_Verification_2026-10-19.md), [planner handoff](PLANNER_HANDOFF.md), [verification](../testing/Planner_Persistence_Verification_2026-10-16.md) and existing [account handoff](ACCOUNTS_HANDOFF.md).
