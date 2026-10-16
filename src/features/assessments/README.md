# Assessments

Proposed owner Dewald; FR-05/06/07. Assessments now save through the shared private planner service, retaining responsive table/list, search, filters, completion/reopening and archive/restore. Disabled mode alone uses the labelled session preview. Read the [planner handoff](../../../docs/development/PLANNER_HANDOFF.md) and [contract](../../../docs/design/Planner_Data_Contract.md).

Use shared fields/enums and validated SAST/Timestamp adapters. Completion sets zero remaining and server completedAt; edits preserve that time, reopening needs positive effort and clears it. Archive retains block history. Reserving time does not reduce effort. Stable create IDs, captured revisions and awaited confirmation protect drafts/retries. New references need active own subjects; existing archived references can remain.

Local tests cover effort toggles, actual backend completion/reopen/history and schema/ownership. Hosted integration, genuine user evaluation and course acceptance evidence remain separate.
