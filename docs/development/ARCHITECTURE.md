# Application and persistence architecture

Actual implementation, 16 October 2026. Product plans under docs/planning preserve the proposed baseline; Git/PR history identifies the integrated version.

The root is one Vite app: index.html -> src/main.tsx -> BrowserRouter -> app/App.tsx -> AuthProvider -> AppShell/routes. Tailwind compiles through Vite. There is no custom API server.

| Path                     | Responsibility                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| src/app                  | Route composition and layout-preview tests                                                             |
| src/features/auth        | Registration/sign-in/out, session lifecycle, profile persistence/validation and private-route boundary |
| src/features/settings    | Seven-day budget/profile editor, dirty state and concurrent-edit recovery                              |
| src/features/subjects    | Persistent subject/class forms and archive/restore                                                     |
| src/features/assessments | Persistent assessments, completion/reopening, filtering and validation                                 |
| src/features/planner     | Shared storage contract/service/workspace, week/day blocks and advisory clashes                        |
| src/features/dashboard   | Live agenda, explained priority, allocation and completion calculations                                |
| src/shared               | Reusable shell/forms, icons and persisted document types                                               |
| src/lib/firebase         | Explicit configuration modes and cached SDK singleton                                                  |
| src/test                 | Test setup and synthetic fixtures, not production user records                                         |
| firebase                 | Profile/planner schemas, ownership/reference rules and real backend tests                              |

## Shared contracts

`users/{uid}` is the profile. Implemented subcollections are subjects, classSlots, assessments and studyBlocks; subjectCodes holds atomic uniqueness claims. Document IDs come from snapshots; there is no editable owner field. One UID-scoped workspace subscribes to four collections through the existing Firebase singleton. Shared types, runtime adapters and rules jointly enforce [contract v1](../design/Planner_Data_Contract.md).

Assessment states: To Do/In Progress/Completed. Priorities: High/Medium/Low. Block states: Planned/Done/Cancelled. Class times are local HH:mm with inclusive YYYY-MM-DD ranges. Instants are Firestore Timestamp; display timezone is Africa/Johannesburg. Each calculation must take an explicit clock and remain independent of React/Firebase.

## Session and profile boundary

`useAuth` exposes current user/profile, status and account actions. `AuthGate` waits for a confirmed valid profile before private routes render; disabled mode alone uses the in-memory preview. Workspace/forms are keyed by UID/status. Sign-out immediately clears private UI and detaches listeners. Planner loading waits for all four confirmed server snapshots, ignores pending/cache snapshots and guards late callbacks by UID/lifecycle. Same-owner listener errors hide/inert the retained view and suspend dialogs until explicit retry; an auth/UID change unmounts everything immediately.

Profile creation and stable-ID planner creation retries are idempotent. Transactions compare captured revisions, preserve createdAt and set server updatedAt. A server-only preflight respects offline mode; transaction reads enforce consistency. Failed writes retain drafts; conflicts require explicit reload/reopening. Dashboard uses live planner state plus reactive profile budgets. No planner browser storage or persistent Firestore disk cache is enabled.

## Backend and checks

Disabled mode needs no account. dev:emulator forces demo-studyflow and loopback services. Cloud configuration remains unverified until an authorized project is tested. Rules permit strictly valid own profile/planner access; unknown collections, foreign access and hard deletes remain denied. SDK chunk ordering and strictExecutionOrder are preserved.

Core checks cover formatting/lint/types/unit-UI tests/build. Rules tests exercise ownership, exact schemas, references, metadata, completion and unique claims. Integration tests use real local Auth/Firestore with actual profile/planner services. CI runs all three commands. Read the [planner handoff](PLANNER_HANDOFF.md), [verification](../testing/Planner_Persistence_Verification_2026-10-16.md) and existing [account handoff](ACCOUNTS_HANDOFF.md).
