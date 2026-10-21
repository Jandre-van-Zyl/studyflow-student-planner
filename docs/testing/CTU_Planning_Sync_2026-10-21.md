# CTU planning sync verification

21 October 2026. Local prototype checkpoint extending 67b6d27. Synthetic accounts/data only.

- `npm run check`: 223 application tests across 27 files passed; formatting, TypeScript and production build passed. Zero lint errors; one inherited AuthProvider ref-cleanup warning at line 236.
- `npm run test:rules`: 119 tests passed. New link checks exercise owner read/list, foreign and anonymous denial, exact fields, missing target, redirection, stale source revision, and hard-delete denial.
- `npm run test:integration`: final 20 tests passed. New coverage includes sign-out/sign-in persistence, concurrent activation, one subject/assessment per source, actual linked study blocks, automatic title/date refresh with personal effort/notes/progress retained, personal overrides, invalid/missing planning inputs, cancellation/wrong owner, missing-to-present identifier rejection, and simultaneous identifier variants without duplicate creation. Existing 200-item limit, offline/revocation and partial-source retention tests also pass.
- `npm run build:cloud` and `npm run build:ctu-helper`: passed. No deployment followed. Helper version/permissions unchanged.
- `git diff --check`: passed.

Browser, Opera at temporary loopback port 5174 using actual Auth/Firestore emulators: seeded labelled synthetic source records; signed into synthetic approved account; opened a date-only CTU task; supplied Project, 90 minutes and 18:00 planning target; saved; observed one linked normal assessment and auto-created subject. Dashboard showed the imported task as its recommendation and 90 minutes remaining. Reload preserved the recommendation. Weekly planner offered the imported task in its normal assessment selector; a 45-minute block saved and displayed against the 60-minute daily budget. Browser error log was empty. Sign-out returned to login and cleared visible private data. Test tab closed and temporary emulators stopped. Screenshots were reviewed inline; no exported screenshot file is claimed.

The CTU portal's actual timetable was downloaded and its text/rendered page inspected; the calendar's September/October pages were visually inspected in the PDF viewer. No real CTU records were saved to Firebase. This browser test verifies saved-data planning, not the entire live extension-to-cloud pipeline. No mobile or full accessibility audit, coverage percentage, cloud rules deployment, automatic retirement, PDF parser, institutional API/SSO approval, push, Hosting or academic submission is claimed.

See [contract and behaviour](../development/CTU_PLANNING_SYNC.md), especially partial-sync retention, identifier limitations, date-only planning targets and retry semantics.
