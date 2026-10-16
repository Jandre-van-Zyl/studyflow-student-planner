# First working session - Saturday 17 October 2026

Proposed starting plan after the shared Main bootstrap. Dewald confirms actual module owners/capacity; Aneesah records decisions. Proposal/supervisor approval and Firestore assessment acceptance need actual evidence, not assumptions.

## Begin together

1. Accept invitations and use your own GitHub identity.
2. Follow SETUP.md: Node 24, fetch, personal branch, merge origin/Main, npm ci, own .env.local, npm run dev.
3. Each member opens their feature route and runs npm run check.
4. Agree shared fields/status values in src/shared/types/planner.ts and coordinate shared edits.
5. Confirm genuine needs, small Must scope, available hours and an internal review time.

## Proposed first tasks

| Member / folder              | First small deliverable                                                       | Evidence needed                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Jandre / auth + lib/firebase | Local register/sign-in/out and current-user context; own-profile rules/schema | Emulator flow, handled errors, account cleanup and permission tests                  |
| Riaan / subjects             | Subject form/validation and own-UID service contract                          | Input/error states and tests; fixture-only work labelled prototype until persistence |
| Dewald / assessments         | Assessment form/list with shared fields and deadline/effort validation        | Acceptance cases and unit/UI checks; integrate with auth/subject contracts           |
| Omphemetse / planner         | Week/day structure and block form with agreed class/assessment inputs         | SAST day labels, interval validation; mock blocks not claimed saved                  |
| Aneesah / dashboard          | Pure priority/budget signatures, boundary fixtures and calculation tests      | Documented ordering/zero/cancelled cases and clear expected outputs                  |

All five need real code contributions; bootstrap is not a substitute. Pages already provide integration points. Add feature components/services/tests as needed and agree shared date/type contracts first.

## First integration checkpoint

Target Sunday 18 October: sign in -> create subject -> save assessment -> dashboard shows it after reload. Each member supplies a focused PR with actual checks and requirement IDs, reviews another member and records genuine defects/results.

Monday 19 October at 12:00 requires separate Week 2 and Week 3 PDFs together, research/SRS/design and each member's first meaningful commits. Evidence runs alongside code. The starter does not complete chapters, literature, SRS or test-results workbooks.
