# Application and account/profile architecture

Actual implementation, 16 October 2026. Product plans under docs/planning preserve the proposed baseline; Git/PR history identifies the integrated version.

The root is one Vite app: index.html -> src/main.tsx -> BrowserRouter -> app/App.tsx -> AuthProvider -> AppShell/routes. Tailwind compiles through Vite. There is no custom API server.

| Path                     | Responsibility                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| src/app                  | Route composition and layout-preview tests                                                             |
| src/features/auth        | Registration/sign-in/out, session lifecycle, profile persistence/validation and private-route boundary |
| src/features/settings    | Seven-day budget/profile editor, dirty state and concurrent-edit recovery                              |
| src/features/subjects    | Planned subject/class forms, services and occurrence calculations                                      |
| src/features/assessments | Planned assessment CRUD, status, filtering and validation                                              |
| src/features/planner     | Planned week/day view, study blocks and advisory clashes                                               |
| src/features/dashboard   | Starter overview; priority/workload calculations remain planned                                        |
| src/shared               | Reusable shell/forms, icons and persisted document types                                               |
| src/lib/firebase         | Explicit configuration modes and cached SDK singleton                                                  |
| src/test                 | Test setup and synthetic fixtures, not production user records                                         |
| firebase                 | Profile security schema, feature guards and real backend tests                                         |

## Shared contracts

`users/{uid}` is the implemented profile. Subject, classSlots, assessments and studyBlocks subcollections remain planned/denied. Document IDs come from snapshots; there is no editable owner field. Future feature services use the current authenticated UID and the existing Firebase singleton. Shared types are not a replacement for runtime/rules validation.

Assessment states: To Do/In Progress/Completed. Priorities: High/Medium/Low. Block states: Planned/Done/Cancelled. Class times are local HH:mm with inclusive YYYY-MM-DD ranges. Instants are Firestore Timestamp; display timezone is Africa/Johannesburg. Each calculation must take an explicit clock and remain independent of React/Firebase.

## Session and profile boundary

`useAuth` exposes current user/profile, status and account actions. `AuthGate` waits for a confirmed valid profile before private routes render; disabled mode provides layout previews only. Feature trees/forms are keyed by UID. Signing out immediately clears private UI, detaches the profile listener and ignores late callbacks. Each future feature still returns its own listener cleanup function.

Profile creation uses a transaction and preserves existing records on retries. Updates compare server revisions, preserve createdAt and use server updatedAt. A preflight server-only read respects SDK offline mode; transactions are re-read for consistency. Settings retain failed/unsaved input and require explicit reload after a concurrent remote edit. Profile updates flow through the shared context; dashboard owners consume that reactive profile when implementing workload calculations.

## Backend and checks

Disabled mode needs no account. dev:emulator forces demo-studyflow and loopback services. Cloud configuration is explicit and unverified until a real authorized project is tested. Rules permit valid own-profile get/create/update; listing/deletion/unfinished collections remain denied. SDK vendor code is split into build chunks rather than raising the chunk warning threshold.

Core checks cover formatting/lint/types/unit-UI tests/build. Rules tests cover profile ownership/schema plus retained guards. Integration tests use real local Auth/Firestore with the actual profile service. CI runs all three commands. Read [design/sequence/data dictionary](../design/Accounts_and_Profile_Design.md), [handoff](ACCOUNTS_HANDOFF.md) and [executed verification](../testing/Jandre_Accounts_Verification_2026-10-16.md).
