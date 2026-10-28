# Final integration and presentation checks

28 October 2026 · StudyFlow for CTU · Group 1

This record describes the final integration candidate built from Main `eb8228a` and the member heads below. The containing release commit is the version to demonstrate. GitHub Actions must be checked against that exact commit after publication; local passing results alone do not establish hosted CI success.

## Team integration

| Branch     | Reviewed head                              | Integration                                                                                                                                |
| ---------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Main       | `eb8228a19903a3ff5e14fb871682e8bca5315a7c` | Existing accounts, planner, dashboard, CTU, timer and grade-book baseline                                                                  |
| aneesah    | `0259b42a15e9f0204cc5c52e7c3477fdfc1b7e0b` | Already contained in Main; dashboard uses shared priority/workload calculations                                                            |
| dewald     | `db979d68895642a9a128c3c82caf1e5ec1e84ea7` | Subject/class validation incorporated into the actual forms, with date/time and duplicate-code regressions                                 |
| omphemetse | `d23a16c20515d20c970fe6389af3888e26880ab3` | Planner screenshots, test records, traceability and chapter/demo contributions retained                                                    |
| riaan      | `3be435d9b34a6e70257f1ddaf552d728bb5e8787` | Introduction/database drafts, ERD, usability report and contribution form retained; current-scope addenda added to chapter/database drafts |
| jandre     | `044eefc7840bcfe61dd474f6bee1f92092f2591e` | Already contained in Main; later integrated account/CTU work is in Main history                                                            |

Merge history preserves original member commits. Personal branches are not overwritten. Each member should commit or safely preserve unfinished work, fetch, and merge `origin/Main` into their own branch using the README commands.

## Release fixes

- CTU deadlines are grouped into active, in-planner, uploaded, finished and all views. Module/search filters and a separate date column make the full list easier to scan. Dashboard shows actionable work first; uploaded work remains available for review. Source modules/resources stay available through disclosures.
- CTU assignment planning and native assessment actions open the matching planner form. Exact assessment links can reveal the requested record even when completed/archived. Generated internal subject codes are replaced with readable module names in labels and choices.
- A block exceeding the daily budget requires explicit confirmation even if it overlaps nothing. Existing overlap checks remain. Editing subtracts the old block when calculating the new allocation.
- Newer profile revisions block stale onboarding saves while retaining unsaved choices; the student can reload the latest routine. Verification instructions explain the email-link and return-to-app steps.
- Timer selection cannot attach an active or unsaved free session to another block. Reminder delivery and visibility handling are guarded; recorded time is saved explicitly. Grade imports validate year/file count, retain failure feedback, separate previews from confirmed reports and stop stale-account work.
- CTU loading has a bounded error/retry path. Authentication cleanup no longer produces the prior lint warning. No new dependency, database schema, permission, paid service or deployment was introduced.
- Existing CTU colours/layout are preserved. Navigation, content entrance, dialogs, feedback and completion checks use restrained motion, with reduced-motion CSS overrides.

## Executed verification

Windows, Node 24.19.0. Synthetic data only for the browser walkthrough; Auth and Firestore ran under local `demo-studyflow`, not the live project.

| Check                                   | Actual result                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `npm run check`                         | Formatting, lint, TypeScript, 286 app tests across 36 files, production build passed                                           |
| `npm test`                              | 286 app tests, 125 Firestore rules tests and 21 Auth/Firestore integration tests passed; isolated emulators stopped afterwards |
| `npm run build:cloud`                   | Cloud-configured build passed; this does not publish Hosting                                                                   |
| `npm run build:ctu-helper`              | Chromium helper build passed                                                                                                   |
| `npm run build:ctu-helper -- --firefox` | Firefox helper build passed; actual Firefox portal flow not rerun                                                              |
| `npm audit --omit=dev`                  | 0 reported production vulnerabilities at this check; not a guarantee against unknown issues                                    |
| Calculation measurement                 | 200 assessments + 200 blocks; ranking and seven daily allocations per run; all ten runs below 100 ms (41.955–70.517 ms)        |

The performance result is a local Node calculation measurement, not network or browser-render latency. See [measurements and environment](../evidence/release-2026-10-28/calculation-performance.json).

New backend regressions cover foreign/revoked owners on grades/study sessions and repeated CTU resync preserving completion, notes and stable links without duplicates. Tests also cover malformed schemas, missing/foreign references, concurrency, failed writes and account changes. Rules themselves were unchanged in this release.

### Browser walkthrough

Codex's Chromium-based in-app browser, 1366×900, 768×1024 and 360×800 viewports. This is a development verification run, not a new participant study.

| Journey                           | Observed result                                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CTU source → assessment → subject | Planned a synthetic FA with 90 work minutes; subject and assessment saved through normal services                                                         |
| Assessment → study block          | Correct assessment preselected; a 90-minute block against a 60-minute budget showed a 30-minute warning and saved only after confirmation                 |
| Block edit and timer              | Edited the block; started/paused its timer; saved 31 seconds; weekly total remained after reload/navigation                                               |
| Uploaded assignment completion    | Uploaded FA moved to finished, appeared as Completed with zero remaining work, and stayed out of active work                                              |
| Grade book                        | Synthetic 78 and 84 module marks averaged 81%; pending module excluded; historical grades did not become planner tasks                                    |
| Phone/tablet layouts              | Tested assessment list, settings, selected-day planner and grade book; no page-level horizontal overflow in the inspected views                           |
| Keyboard/focus                    | Mobile menu opened with Enter, navigation and profile save worked by keyboard, modal/step focus moved to the active form/heading                          |
| Settings                          | Saved Thursday budget changed to 75 and was reflected in the weekly planner                                                                               |
| Account boundary                  | Sign-out cleared the workspace; a second verified but unapproved user saw the approval gate; local approval opened their own onboarding and empty planner |
| Onboarding                        | Selected Mon/Wed/Fri, adjusted Wednesday to 45; review showed 2 h 45 min, and saving populated the matching budgets                                       |
| Subject/class                     | Second account created SE2 from lowercase input and saved a Wednesday recurring class                                                                     |
| Failure feedback                  | Incorrect password displayed a readable sign-in error; helper absence showed installation instructions and disabled Connect                               |

Screenshots contain labelled synthetic information. See [dashboard](../evidence/release-2026-10-28/dashboard-1366.jpg), [phone assessments](../evidence/release-2026-10-28/assessments-360.jpg), [phone planner](../evidence/release-2026-10-28/planner-360.jpg), [tablet grades](../evidence/release-2026-10-28/grades-768.jpg), [onboarding](../evidence/release-2026-10-28/onboarding-1366.jpg) and [account isolation](../evidence/release-2026-10-28/second-account-empty-1366.jpg). This does not claim full WCAG certification or every page/state on every browser.

## Requirements and document reconciliation

Core FR-01–12 remain implemented: access/profile, subjects/classes, assessment lifecycle/filtering, weekly view/blocks, clashes, advice and workload. FR-14 timer is implemented. FR-13 CSV and FR-15 dark mode were not selected for this release; their optional test cases are **not applicable**, not independently passed. Facilitator quizzes/attendance are future scope; Class activities communicates that boundary.

Use [the requirements baseline](../planning/Student_Planner_Requirements_and_Tests.md), [planner contract](../design/Planner_Data_Contract.md) and [current data/scope addendum](../design/Release_Data_and_Scope_2026-10-28.md). Riaan's core ERD predates CTU/grade/timer collections; include the addendum in Chapter 4. The original individual contribution and usability forms were not rewritten. Contributor-reported results remain attributable to their author and test date; they are not substituted for this release's executed checks. The reported intermittent planner freeze is not claimed root-caused merely because this walkthrough passed.

## Rehearsal and remaining acceptance

Before the presentation on **29 October**, Jandre and Dewald should use the same commit on the presentation computer:

1. Preserve local work, update from Main, run `npm ci`, then `npm run dev`. The frontend opens at `http://127.0.0.1:4173/account` with the real Firebase backend. Use an approved, verified personal CTU email. Do not share passwords or grant Firebase admin access.
2. Build/reload the unpacked helper in the same browser. Sign into the student's own CTU portal, connect, inspect current deadlines and one uploaded item, navigate away/back, reload, and resync. Confirm no duplicates and no loss of personal completion/estimates. This final real-portal/device check remains to be done; this run used synthetic source data.
3. Demonstrate one assessment, a conflict/over-budget warning, a saved study block, timer save, grade book and sign-out. Keep a short recording/screenshots as fallback. Firefox/Safari/mobile extension support and OS notifications must not be claimed universally tested. Safari helper packaging is not implemented; always-on-top depends on browser support. Reminders need the app open.
4. Confirm the final cloud rules match the repository on the presenting setup. This release changes no rules and makes no Firebase/Hosting deployment. Live two-account isolation and a clean second-machine installation were not repeated here.
5. Dewald assembles the official six-chapter dissertation, required workbooks, slides/video and signed member forms, verifies the lecturer's time/upload instructions, and submits. Code checks do not replace signatures, consent, attendance, participant evidence or actual submission.

Automatic timetable extraction, portal SSO/API integration and automatic grade-PDF downloads remain outside implemented scope. Resource links are shown, not parsed into guessed class times. The existing manual grade report import remains the reliable route for results; pending/completed historical modules stay out of the planner.

## Standalone first-account routine follow-up

New approved accounts now enter `/study-setup` before the normal workspace mounts. The screen contains the CTU branding and routine controls, with no navigation, planner date, timer or other app actions. Students can finish the three steps or choose **Do this later**. Either choice must be confirmed by the existing revision-aware profile save before opening the dashboard. Deferring retains the saved budgets and discards unfinished choices; the profile revision remembers that setup was addressed across reload/sign-in without a new database field or rule change.

The routine remains accessible through Settings. Existing students revisiting it keep their normal workspace and active timer; first-account isolation does not discard a running session on that existing route. Failed deferral remains on the form with a retryable error. A newer profile revision still requires reloading the latest routine before saving.

Meaningful regressions cover first-account entry through dashboard/subjects/account, absence of app chrome and planner subscriptions, deferral versus an unfinished draft, failed deferral, dashboard transition, remount without a repeat prompt, and a running timer surviving an existing student's routine visit. Browser verification used two disposable local accounts: standalone desktop/phone views, deferral surviving reload, all three completion steps, saved Monday 90-minute budget, and return to the dashboard. See [desktop first-account screen](../evidence/release-2026-10-28/onboarding-standalone-1366.jpg) and [phone screen](../evidence/release-2026-10-28/onboarding-standalone-360.jpg).

Fresh follow-up verification: `npm run check` passed formatting, lint, TypeScript, 293 app tests and production build. `npm test` passed 293 app + 125 rules + 21 integration tests (439 total), and `npm run build:cloud` passed. No cloud data, rules or hosting were changed. Local test services were stopped afterwards.

## Visible CTU login tab follow-up

Helper 0.1.5 opens the CTU collection tab in the foreground immediately. Previously it created an inactive tab and waited for login navigation before activating it. A failing-then-passing worker regression checks the visible tab request. Full app checks passed 294 tests, and Chromium/Firefox helper builds passed without new permissions. In Opera, the helper was reloaded, the CTU login page appeared and Jandre confirmed signing in. Collection reached the account save step; it then encountered the existing changed-source-reference duplicate safeguard. The save error now identifies the affected item and whether CTU supplied a new reference or omitted an existing one. This distinguishes successful portal opening from a separately blocked source reconciliation; no unsafe duplicate or identity migration is implied.
