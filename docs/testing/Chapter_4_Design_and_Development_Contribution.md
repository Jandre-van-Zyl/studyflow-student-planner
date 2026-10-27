# Chapter 4 — System Design and Development (Omphemetse's contribution)

> **Template note:** These are working section headings. Replace or renumber them to match the official Chapter 4 template supplied by the team. The descriptions below are limited to the StudyFlow project context and the contributor's documented planner work.

## 4.2 Planner and study-block design

The StudyFlow planner is intended to help students organise study time around subjects, classes, assessments, and weekly time budgets. The planner workflow allows a student to create a dated study block, review it in the planner, and manage its state. Study blocks must be associated with the signed-in user's data and should remain consistent after a reload when successfully saved.

The planner design considers the relationship between a study block and other calendar commitments. A block that overlaps a scheduled class should produce a warning so the student can decide whether to change the time or explicitly confirm the overlap. Adjacent blocks whose endpoints touch (for example, 09:00–10:00 and 10:00–11:00) are not treated as overlapping. Cancelled blocks are excluded from active overlap checks and allocated workload, according to the tested behaviour.

### Key design considerations
- **Clear feedback:** display validation errors and overlap warnings before a student commits an invalid or conflicting entry.
- **Explicit override:** where the application supports confirming an overlap, the user must make an intentional choice.
- **Persistence:** saved entries should still be present after refresh or reopening the relevant view.
- **State consistency:** cancelled, completed, and active blocks must be treated consistently in planner and workload calculations.
- **Ownership and privacy:** user-specific planner data must not be exposed to another signed-in account.
- **Responsive use:** the main workflow should remain usable at supported desktop and mobile widths.

## 4.6 Validation, overlap handling, and planner state

Validation prevents malformed or illogical schedule data from being accepted. Relevant checks include required fields, valid dates and times, supported block durations, and valid references to the user's own records. The test plan also covers class overlap, boundary conditions, and the effect of cancelling or completing a block.

The class-overlap workflow is documented in the contributor's execution record. A class-boundary test passed when a class ended at 10:00 and a study block started at 10:00. In the class-overlap confirmation scenario, the warning appeared; the first confirmation attempt caused the application to freeze. After restarting the local environment and recreating the test data, the retest passed: confirming the overlap saved the block and the app remained responsive. The initial freeze remains a recorded intermittent issue because the root cause has not been established.

## 4.8 Testing evidence and reproducibility

The contributor reports that all 35 test cases (TC-01–TC-35) were completed and passed review. The test register distinguishes the planner scenarios documented through collaborative step-by-step testing from the remaining cases completed by the contributor. Results are marked as contributor-reported where there is no separate captured execution artifact.

Evidence currently identified in the repository includes:
- `docs/evidence/OMP-PL-06_Class-Boundary_PASS_2026-10-26.png`
- `docs/evidence/OMP-PL-07_Class-Overlap-Confirmation-RETEST_2026-10-26.png`
- `docs/testing/Omphemetse_Planner_Test_Execution_Record_2026-10-19.md`

The existing record covers OMP-PL-01 through OMP-PL-07. The first five scenarios were documented without screenshots. The final report should include available evidence without implying that missing screenshots exist. For reproducibility, record the tested commit/revision, environment, commands used, results, and any setup issues. The previously reported automated check passed Prettier, ESLint, TypeScript, 130 Vitest tests across 13 files, and the Vite production build; these checks should be rerun on the final revision.

## Design and development summary

Omphemetse's documented contribution focuses on planner study-block behaviour, overlap and boundary scenarios, test coordination, and preparing the test evidence and reporting material. The project report should distinguish implementation ownership from test coordination and should not claim that the contributor implemented every feature in the system unless the team's contribution records confirm that fact.

## Individual contribution to StudyFlow

My contribution to StudyFlow focused on the student planner workflow, study-block testing, test documentation, and reporting. I documented the expected behaviour of study blocks, including saving and reloading entries, cancellation, class-overlap warnings, and boundary conditions. I also recorded the observed results of the planner tests and documented the intermittent application freeze encountered during the class-overlap confirmation test, together with the successful retest.

In addition to the planner execution record, I contributed to the preparation of the test-case register, requirements traceability matrix, defect log, testing results, and demonstration documentation. These artefacts support the team's evaluation of the application against the documented functional and non-functional requirements.

My testing documentation distinguishes detailed manual observations from results reported for the broader test suite. The reported outcome of 35 passed test cases should be interpreted in the context of the available evidence. The intermittent freeze remains a limitation requiring further investigation because its root cause has not been established.
