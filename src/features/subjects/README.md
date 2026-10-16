# Subjects / classes

Proposed owner Riaan; FR-03/04. Subjects/classes now save through the shared UID-scoped planner service, with strict validation, atomic unique code claims, recurring active dates and archive/restore. Disabled mode retains the labelled session preview. Read the [planner handoff](../../../docs/development/PLANNER_HANDOFF.md) and [contract](../../../docs/design/Planner_Data_Contract.md).

Reuse shared Subject/ClassSlot, plannerContract, plannerService and planningView. Archive referenced subjects; never cascade-delete history. New references require active own subjects; existing records may retain an archived parent. Dates are inclusive and times HH:mm SAST. Keep stable create IDs and captured revisions; retain failed drafts. Coordinate types/validation/rules/tests together.

Local verification includes save/reload, uniqueness/concurrency and owner/schema tests. Cloud integration, team review and the full assessment evidence remain separate. This implementation is not another member's contribution record.
