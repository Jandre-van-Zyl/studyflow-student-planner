# StudyFlow Demonstration Script (3–5 minutes)

> Use the actual working build and test account. Do not show passwords, API keys, `.env.local`, or another user's private data. Adapt the sequence to features available in the final build.

## 0:00–0:30 — Introduction

“StudyFlow is a student-planning application designed to help students organise study blocks around their subjects, classes, and assessments. I will demonstrate the planner workflow and explain the testing I completed.”

## 0:30–1:15 — Planner and saved block

“Here I can create a study block with a date and time. After saving, I can see it in the planner. The relevant test checked that the block remained after refreshing the view.”

Show a test block using non-sensitive sample data. If appropriate, refresh and show persistence.

## 1:15–2:15 — Overlap and boundary behaviour

“The planner checks for conflicts between study blocks and classes. Adjacent time ranges, where one ends exactly when another begins, should not be treated as overlapping. If a real overlap exists, the application shows a warning and requires an explicit choice.”

Demonstrate a safe sample if the current build is stable. Do not deliberately recreate the freeze in a live presentation. Explain honestly that the first confirmation attempt in the documented test froze, but the retest passed after restarting the local environment and recreating the test data. The initial observation remains documented.

## 2:15–3:00 — Cancellation and workload

“I also checked that cancelled blocks are not treated as active conflicts and are excluded from the allocated workload.” Show the relevant view if available.

## 3:00–4:00 — Testing and results

“I reviewed 35 test cases covering authentication and account privacy, validation, subjects, classes, assessments, dates, study blocks, workload, responsive behaviour, error handling, and reproducibility. I report all 35 as passed in the final review. The test register distinguishes the planner scenarios documented collaboratively from the remaining cases I completed.”

If the examiner asks for evidence, open the actual test register and the available OMP-PL-06 / OMP-PL-07 evidence files. Do not claim that every case has a screenshot if it does not.

## 4:00–5:00 — Closing

“The main remaining documentation step is to attach the final revision's automated check output and ensure the report matches the official template. Thank you.”

## Before presenting

- Confirm the local application starts and is stable.
- Use a test account and sample data.
- Keep `.env.local` and credentials private.
- Open the actual evidence files before the demo.
- Do not demonstrate optional CSV/timer/dark-mode features unless they are included in the reviewed build.
