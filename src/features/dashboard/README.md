# Dashboard / advice / workload

Proposed owner Aneesah; FR-11/12. DashboardPage now shows a chosen-day agenda, explained assessment ordering, budget allocation and completion derived from the labelled session preview. Read [UI handoff](../../../docs/development/UI_HANDOFF.md). Live feature datasets and persistent integration remain outstanding.

Reuse pure helpers/tests in planner/planningView.ts before integrating live datasets. Use one explicit now and the plan's ordering/budget rules. Explain urgency/manual priority; quick-task badges do not override order. Sum non-cancelled blocks including Done and compare the declared daily budget. Zero must not produce NaN/Infinity. This is allocated session time, not verified time studied.

First acceptance: boundary fixtures/tests and understandable output. Synthetic test data must not appear as real user counts or completed evaluation evidence.
