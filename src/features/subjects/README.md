# Subjects / classes

Proposed owner Riaan; FR-03/04. SubjectsPage now has subject/class forms, divided lists and archive/restore in the labelled session preview. Read [UI handoff](../../../docs/development/UI_HANDOFF.md). Firebase CRUD remains outstanding.

Use shared Subject/ClassSlot. Reuse the UI and tested occurrence adapter in planner/planningView.ts; add service, listener/loading/error states, server validation and rules tests. Archive referenced subjects; scope all paths to the authenticated UID. Class slots have inclusive active dates and same-day HH:mm SAST times. Coordinate stored validation/rules with foundation.

First acceptance: valid subject entry, useful empty/error states and tests, then own-user persistence after integration. Keep fixtures labelled prototype.
