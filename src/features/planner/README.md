# Weekly planner / study blocks

Proposed owner Omphemetse; FR-08/09/10. PlannerPage now saves private study blocks through the shared planner service, retaining week/day views, named overlap confirmation, budget warnings and cancelled history. Disabled mode alone uses the labelled session preview. Read the [planner handoff](../../../docs/development/PLANNER_HANDOFF.md) and [contract](../../../docs/design/Planner_Data_Contract.md).

PlanningWorkspace owns four server listeners and failure/retry/UID guards. plannerContract derives validated inputs/views from shared types; plannerService supplies revision-checked saves and stable-ID retries. Consume shared collections rather than querying each calendar cell. Blocks last 15–180 minutes on one SAST day. Overlaps are half-open; changed observed conflicts require renewed confirmation. This is advisory, not a global lock. Cancelled blocks do not reserve time; completion/archive retains and labels history.

Local unit/rules/integration/browser checks are recorded separately from cloud deployment, team review and full course acceptance. No samples are copied into signed-in accounts.
