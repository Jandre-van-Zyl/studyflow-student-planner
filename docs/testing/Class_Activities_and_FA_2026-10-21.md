# FA wording and Class activities verification

21 October 2026. Local changes on `prototype/ctu-sync-20261021`, based on code commit `8685a4f`. Prior cloud-activation documentation changes were preserved.

- FA source titles now display Assignment, use assignment/work wording, and default the planning form to Assignment. Unknown names remain unclassified; existing saved types and effort are not migrated or overwritten.
- Added `/class-activities` inside the existing authentication gate, with shared desktop/mobile navigation, page title and focus behaviour. The page explicitly identifies facilitator integration as future work and has a working link to Assessments.
- Documented the requested future facilitator-managed rosters, activities, notifications, attachments, submissions, timed after-class quizzes, participation and reviewed attendance in `docs/planning/CLASS_ACTIVITIES.md`. No facilitator backend, file storage, notification delivery, quiz engine or attendance system is implemented in this checkpoint.

## Checks

- `npm run check`: formatting passed; zero lint errors with the existing AuthProvider ref-cleanup warning; TypeScript passed; **237 application tests in 28 files passed**; default production build passed.
- `npm run build:cloud`: TypeScript and cloud-configured local build passed. Existing CTU account saving remains enabled.
- `git diff --check`: passed.
- Browser against the real local app: previously saved CTU data reloaded; three FA entries had assignment actions; opening the first FA showed selected type Assignment, Work minutes remaining and Save assignment plan. Cancelled without creating a real task. Dashboard showed three Plan assignment links. Class activities navigation and Open assessments link worked; the Class activities route reloaded successfully.

Application services, data contracts and Firestore rules are unchanged, so rules/integration suites were not rerun. No new live records, cloud rule publication, account permissions, GitHub push or Hosting release were part of this change. The prior cloud activation remains in force. New facilitator permissions and upload/scoring services still require their own contracts and tests. No mobile-device or complete accessibility audit is claimed.
