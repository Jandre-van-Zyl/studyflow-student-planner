# Omphemetse — Planner Test Execution Record

**Record date:** 19 October 2026
**Tester:** Omphemetse Dikeledi
**Branch:** `omphemetse`
**Tested revision (Git SHA):** `044eefc7840bcfe61dd474f6bee1f92092f2591e`
**Environment:** Local StudyFlow application using the project’s local development setup; Windows PowerShell; Node.js `v24.22.0`; npm `11.19.1`; Java `21.0.7`.
**Data:** Disposable local test account and synthetic study-block records.
**Scope note:** This record contains only the manual planner checks reported as personally performed by the tester. It does not claim that all 35 planned acceptance cases have passed.

## Manual test results

| Test record | Requirement / planned case | Steps actually performed | Expected result | Actual result observed | Status |
|---|---|---|---|---|---|
| OMP-PL-01 | FR-09; related to TC-18 — create and reload a study block | Opened the Planner; created a study block titled `Software Engineering Test` for 20 October 2026, 10:00–11:00; saved it; refreshed the page. | The saved block should appear in the planner and retain its date and time after refresh. | The block saved and displayed. After refresh, it remained visible with the correct date and time. | **PASS** |
| OMP-PL-02 | FR-10; related to TC-21 — detect and explicitly confirm an overlap | Created a second block titled `Database Study Test` for 20 October 2026, 10:30–11:30, overlapping the first block; observed the warning; explicitly confirmed the overlap. | The planner should warn about the overlapping interval and require explicit confirmation before saving the conflict. | The app displayed an overlap warning and asked for confirmation. After confirmation, the second block saved. | **PASS** |
| OMP-PL-03 | FR-09; related to TC-18 — cancel a block and check the active planner after refresh | Used the Cancel option on a study block; checked the active Planner; refreshed the page. | The cancelled block should no longer appear among active planner blocks after refresh. | The cancelled block disappeared from the active Planner and remained absent after refresh. | **PASS — limited scope** |

## Limits and follow-up

- OMP-PL-03 verifies absence from the active Planner after refresh only. It does **not** independently verify the stored cancellation record, retained history, or the effect on workload totals.
- OMP-PL-02 verifies the overlap warning and explicit confirmation flow for the two study blocks described above. It does not cover class conflicts, touching endpoints, cancelled-block overlap exclusions, or changes to conflicts after confirmation.
- These manual checks do not establish that every date/time boundary, browser size, user-isolation case, failure/retry case, or other planned acceptance case passes.
- The repository’s existing automated verification reports are separate evidence. Refer to those reports for their own recorded commands, results, limitations, and revision; do not attribute those runs to this manual record unless the tester independently reruns them.
- No defect was reported during these three observed journeys. This is not a claim that the application has no defects.

## Suggested next tests

1. Verify that cancelling a block changes the allocated workload as expected.
2. Verify that the cancelled block remains available in the appropriate history view, if exposed by the UI.
3. Test a block that starts exactly when another block ends; half-open interval rules say touching endpoints should not conflict.
4. Test a block overlapping a class and record the actual warning and confirmation behaviour.
5. Continue through the remaining planned acceptance cases, recording each case only after it is actually run.

## Evidence handling

No screenshots or console logs are attached to this record. Add an evidence path only when an actual screenshot or log has been captured and saved in the repository. Keep test data synthetic and never include credentials or the contents of `.env.local`.

## Additional Manual Test Results — 20 October 2026

### OMP-PL-04 — Touching Study-Block Endpoints

**Test objective:** Verify that consecutive study blocks can be scheduled without an overlap warning when the first block ends exactly when the second begins.

**Test steps:**
1. Created and saved `Boundary Test A` for 20 October 2026, from 09:00 to 10:00.
2. Created and saved `Boundary Test B` for 20 October 2026, from 10:00 to 11:00.

**Expected result:** The second block should save without an overlap warning because the first block ends exactly when the second begins.

**Actual result:** The second block saved without an overlap warning.

**Status:** PASS — for touching study-block endpoints only.

### OMP-PL-05 — Excluding Cancelled Study Blocks from Overlap Detection

**Test objective:** Verify that a cancelled study block does not trigger an overlap warning when a new block is scheduled during its former time.

**Test steps:**
1. Cancelled `Boundary Test B`, scheduled from 10:00 to 11:00.
2. Confirmed that the cancelled block disappeared from the active Planner.
3. Created and saved `Cancelled Overlap Test` for 20 October 2026, from 10:15 to 10:45.

**Expected result:** The cancelled block should not trigger an overlap warning.

**Actual result:** The new block saved without an overlap warning about the cancelled block.

**Status:** PASS — for excluding cancelled study blocks from overlap detection.

### Coverage Limitations

These results confirm only the specific scenarios described above. The separate scenario in which a class ends at 10:00 and a study block starts at 10:00 has not been tested. Therefore, these results do not establish that the entire TC-22 test case has passed.

No screenshots or other supporting evidence were captured for these additional manual tests.

## OMP-PL-06 — Class-Boundary Test

**Test date:** 26 October 2026
**Feature:** Planner — class and study-block scheduling
**Status:** PASS

### Objective

Verify that a study block can start exactly when a scheduled class ends without triggering an incorrect class-overlap warning.

### Test data

| Field            | Value                     |
| ---------------- | ------------------------- |
| Subject          | 422 · Mathematics         |
| Class date       | Monday, 26 October 2026   |
| Class time       | 09:00–10:00 SAST          |
| Assessment       | Boundary Test Assessment  |
| Study block      | Class Boundary Test Block |
| Study-block time | 10:00–11:00 SAST          |

### Expected result

The application should allow the study block because it begins at the exact time the class ends. The two intervals do not overlap.

### Actual result

The study block saved successfully without an overlap warning. Both the Mathematics class and the study block were visible in the Planner at their correct times.

### Evidence

*Screenshot: `../evidence/OMP-PL-06_Class-Boundary_PASS_2026-10-26.png`Select-String -Path "
* The screenshot was captured from the running application and saved in the project's testing evidence folder.

### Limitations

This test verifies only the case where a study block starts exactly when a class ends. It does not establish that all class-overlap scenarios pass. The result was observed in the application; automated test coverage was not established by this manual test.git diff --check
