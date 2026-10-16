# Assessments

Proposed owner Dewald; FR-05/06/07. AssessmentsPage now has responsive table/list, editor, search, filters, completion/reopening and archive/restore in the labelled session preview. Read [UI handoff](../../../docs/development/UI_HANDOFF.md). Firebase CRUD remains outstanding.

Use shared fields/enums. Reuse the UI; add services, server-side runtime validation and tests. Store deadlines as Timestamp, display SAST; preview adapters currently use SAST strings and do not persist completedAt. Persistent completion must set zero remainingMinutes/completedAt; reopening requires positive effort and clears completedAt. Archive to retain block history. Reserving a block does not reduce effort. Reuse a stable preallocated ID across uncertain save retries and coordinate auth/subject/rules contracts.

First acceptance: valid assessment form/list and tests, then persistent own-user save/reload. Fixtures are not stored academic records.
