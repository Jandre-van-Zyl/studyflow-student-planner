# Weekly planner / study blocks

Proposed owner Omphemetse; FR-08/09/10. PlannerPage now has week/day views, a block editor, named clash confirmation, budget warnings and retained cancelled history in the labelled session preview. Read [UI handoff](../../../docs/development/UI_HANDOFF.md). Persistent block services remain outstanding.

Consume classes/assessments through agreed contracts; do not duplicate source entities or queries per cell. Reuse planningView.ts interval/occurrence helpers and tests; connect existing UI to a UID-scoped service with complete loading/error/uncertain-write states. Blocks last 15-180 minutes within one local day. SAST dates and half-open overlap rules apply. Warnings are advisory against loaded data with explicit overrides, not a global calendar lock. Cancelled blocks do not reserve workload; assessment completion/archive preserves history.

First acceptance: readable combined-view structure and validated form; label synthetic examples until persisted integration exists.
