# Shared bootstrap architecture

Actual foundation, 16 October 2026. The detailed product plan remains proposed; this describes the source now provided.

The root is the Vite app: index.html -> src/main.tsx -> BrowserRouter -> app/App.tsx -> AppShell -> feature page. Tailwind compiles through Vite. React Router supports history/deep links. Firebase supplies future Auth/data services; no custom API server exists.

| Path                        | Responsibility                                               |
| --------------------------- | ------------------------------------------------------------ |
| src/app                     | Composition, routes and starter tests                        |
| src/features/auth           | Account/auth flow; future current-user context and lifecycle |
| src/features/subjects       | Subject/class forms, services and class occurrences          |
| src/features/assessments    | Assessment form/list, status, filtering and validation       |
| src/features/planner        | Week/day view, blocks and advisory clashes                   |
| src/features/dashboard      | Overview UI and pure priority/workload functions             |
| src/features/settings       | Profile and seven daily study budgets                        |
| src/shared/components       | Reusable shell/UI and initial workspace state                |
| src/shared/types/planner.ts | Persisted entity types, enums and SAST constant              |
| src/lib/firebase            | Explicit modes and lazy SDK singleton                        |
| src/test                    | Browser-test setup                                           |
| firebase                    | Initial rules, indexes and local rule tests                  |
| public                      | Public static assets, never credentials/participant files    |

Each feature already has a page and README. Add components/services/hooks and colocated tests inside it when real files are needed. Avoid empty folders, unused abstractions or duplicated shared rules. Coordinate changes to shared code.

## Contracts

Proposed paths: users/{uid} plus subjects, classSlots, assessments and studyBlocks subcollections. Interfaces represent loaded documents. WithId adds the snapshot ID for UI use; do not store editable owner fields or duplicate IDs. Future writes use typed converters/WithFieldValue and server timestamps as appropriate, plus runtime validation and actual rules. TypeScript is not a security boundary.

Assessment states: To Do, In Progress, Completed. Priorities: High, Medium, Low. Block states: Planned, Done, Cancelled. Class times are local HH:mm with inclusive YYYY-MM-DD date ranges. Instants are Firestore Timestamp; display timezone is Africa/Johannesburg. Pure calculations take an explicit clock/now and remain independent of React/Firebase.

Pages call feature service functions. Services use getFirebaseServices and authenticated-UID paths. No auth context, CRUD services, real-time planner data context, business calculations or owner-specific rules have been implemented by this bootstrap.

## Firebase boundary

Default disabled mode starts without credentials. Data-service calls then give a setup error. Emulator mode forces demo-studyflow/localhost and ignores cloud values. Cloud mode is explicit and validates required public config. Importing the client does not connect; initialization is lazy/cached, including across Vite hot replacement. Configuration does not prove service reachability. Current rules deny all access; replace them with tested owner/schema validation as features are built.

## Checks

Unit/UI tests cover default start, navigation, missing routes, invalid/complete config and demo/cloud isolation. Optional rule tests start a demo emulator and verify the initial guard denies anonymous reads and signed-in writes. Extend these for real features. npm run check is the core local/CI gate; these starter tests do not mark the 35 planned acceptance cases passed. No fabricated data/results or completed research is provided.
