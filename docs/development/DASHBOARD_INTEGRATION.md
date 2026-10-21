# Dashboard calculation integration

21 October 2026. Local integration of Jandre's account/planner work at `5da02c3` and Aneesah's corrected calculation utilities at `0259b42`. This document describes the combined candidate; it does not mean Main or Hosting has been updated.

## One calculation implementation

- [priority.ts](../../src/features/dashboard/utils/priority.ts) owns filtering, deadline buckets, priority/deadline/remaining-effort/ID ordering, explanations and the 1-30 minute quick-task flag. All items use one captured `now`.
- [workload.ts](../../src/features/dashboard/utils/workload.ts) owns daily allocation by South African calendar day and the finite daily budget summary. Planned and Done count; Cancelled does not. Classes are outside the study-only allocation. Retained blocks still count after their assessment is completed or archived.
- [planningView.ts](../../src/features/planner/planningView.ts) keeps the existing `rankedAssessments` and `allocation` entry points as adapters. It converts SAST strings to Date values for calculations, then returns original assessment objects so display strings and revision metadata remain intact. It does not change saved records or reorder source arrays.
- [DashboardPage.tsx](../../src/features/dashboard/DashboardPage.tsx) consumes those recommendations and the budget summary. It shows a Quick task label only when the recommended assessment has 1-30 minutes remaining. The bar still uses a finite display scale even when the budget is zero.
- [PlannerPage.tsx](../../src/features/planner/PlannerPage.tsx) already calls `allocation`, so its day totals and projected overlap/budget checks use the same calculation without a second algorithm.

Persisted Firebase Timestamp values still enter through [plannerContract.ts](../../src/features/planner/plannerContract.ts). No new collection, dependency, subscription, seed account or storage format is introduced. Existing verified-email/approved-student access, owner rules, revision checks and error states remain.

## User-visible differences

Recommendations now come from Aneesah's implementation. The previous ordering rules remain, with elapsed instants compared correctly even if equivalent inputs use different timezone offsets. Explanation copy now says, for example, `Due within 72 hours - high priority` rather than `Due within 3 days · high priority`. Quick recommendations display their label. Workload uses SAST calendar days, including a UTC timestamp that falls after local midnight.

The CTU identity, account admission, cloud build isolation and post-save confirmation fixes come from Jandre's previously local commits. They are not newly authored by this integration. The website stays local. Changes to Main, member branches, Firebase or Hosting need their applicable authorization; the latest instruction for this candidate is do not push.

## Checks and evidence

Run `npm run check`, `npm run test:rules` and `npm run test:integration`. Stop any manually running emulators first. Use `npm run dev` for the local login/emulator workflow; nothing is automatically seeded or approved.

The calculation tests cover the exact published ranking boundaries and tie rules. The integration tests in [planningView.test.ts](../../src/features/planner/planningView.test.ts) check source/display preservation and equivalent instants. [DashboardPage.test.tsx](../../src/features/dashboard/DashboardPage.test.tsx) checks actual recommendation content, quick labels, selected-day workload, cancellations and zero budgets. Existing workspace tests retain account isolation/loading/error checks. See the dated verification record in `docs/testing` for actual completed results and limitations.

The original PR labels accidentally reused TC-26/27/28 for unrelated recommendation cases. Their recommendation assertions remain, with labels corrected to TC-23 or FR-11. TC-26/27 remain the workload and zero-budget cases; a narrow unit test is not proof that every capstone acceptance case has passed.
