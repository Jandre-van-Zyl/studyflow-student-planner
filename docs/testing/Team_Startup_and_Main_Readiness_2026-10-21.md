# Team startup and Main readiness — 21 October 2026

User requested simple local frontend/live backend manual testing, npm test with a Java local backend, safe team access and pre-push checks. No push authorised or performed by this task.

## Implemented command contract

- npm ci: locked repository dependencies, no global Firebase install.
- npm run dev: Vite cloud mode, loopback4173/account, real studyflow-ctu-capstone Auth/Firestore. Exact4173 origin preserves helper compatibility.
- npm run test: one local Auth/Firestore emulator lifecycle under demo-studyflow, then app, rules and integration suites. Firestore uses Java21+. No Spring backend or cloud test writes.
- npm run test:unit: quick Vitest app suite.
- npm run dev:local: previous manual emulator workflow,5173/account; demo:approve remains loopback-only.

Checked-in .env.cloud contains only allowlisted public VITE browser fields and feature flags. .env.cloud.local and all other local credential patterns remain ignored. A clean temporary environment directory containing ONLY .env.cloud resolved cloud mode, correct project, CTU feature/save flags; no private local config needed. CI now runs npm test after Node/Java setup and core checks; GitHub permissions remain contents:read, no cloud credential/deploy step.

Manual guide: ../development/TEAM_TESTING.md. Root README and development SETUP/FIREBASE have current-startup notices. Teammates register their own CTU address, verify it and require Jandre's active approvedStudents entry. No email approvals added here. Real manual test records remain private and should be archived/cancelled afterward. Installed helper requires manual reload after rebuilding.

## Security verification

Live Firebase console Users and permissions on21October showed exactly one human project member: Jandre's existing signed-in Google account, Owner. Four service accounts also listed; no teammate human project member/grant. No IAM change. GitHub Write permissions do not grant Firebase IAM. App SDK/rules prevent students from writing approvedStudents, rules or other owners' private records. Members may propose rule-file changes in PRs but cannot deploy to the project without independent IAM access. Spark/no billing remains visible.

Scanned the tracked plus nonignored candidate files for private-key PEM, service-account type/private_key, FIREBASE_TOKEN and GOOGLE_APPLICATION_CREDENTIALS assignments: no matching paths. Original reports, .env.cloud.local, generated output and node_modules remain excluded. This is a targeted scan, not a claim of exhaustive secret detection across all Git history. Public Firebase web API config is intentionally shared; authorisation remains IAM/rules. References: https://firebase.google.com/docs/projects/api-keys and https://firebase.google.com/docs/projects/iam/overview.

## Correctness fixes included before Main

CTU durable import now rejects a missing course rather than changing IDs/connection context after partial page failure. Equal module/title rows with distinct source IDs remain separate and retain independent submission flags. Ambiguous ID-less joins fail without saving rather than merging unrelated records. Two focused regressions added; prior valid home/upload merges remain tested. Existing missing-data archive policy unchanged. Helper rebuilt; installed helper reload still required.

## Actual checks

- Fetched origin Main live:946018ddeaff0f3d746cf1e20b87731b8d554419. It is an ancestor of current prototype HEAD8685a4f; no new remote integration conflict observed.
- npm run check passed260app tests/33files, format, TypeScript, default build; zero lint errors and one inherited AuthProvider cleanup warning.
- Exact npm run test passed260app tests,121rules tests and20Auth/Firestore integration tests in one emulator run, then shut both down successfully.
- npm run build:cloud and npm run build:ctu-helper passed. git diff --check passed.
- Actual npm run dev started cloud mode on temporary4174 to preserve the existing4173 app; loopback HTTP200 and transformed client module contained cloud mode and correct project. Temporary server stopped. The first unprivileged HTTP probe was sandbox-blocked; the approved local probe succeeded. No real user test data written.
- Config-only clean-environment check passed without ignored .env.cloud.local. This was not a fresh-machine npm ci/build certification.

## Readiness boundary

No credential/admin-access blocker or failing tested gate found for a reviewed Main integration of this working tree. Include all required new source/docs/brand assets AND public .env.cloud in the eventual commit; do not include private environment files, PDFs or generated output. Current changes are uncommitted over prototype HEAD8685a4f and are not yet on Main. Review the complete diff and obtain the explicit push instruction before publication. Do not reset member branches; their individual work must be preserved.

Remaining product limits are documented rather than hidden: automatic academic-record helper sync, all-browser certification, real two-account/device walkthrough, true accessibility/device checks, new timer/grade service concurrency integration and genuine capstone acceptance evidence. Seven dev-CLI audit entries remain documented; no forced dependency fix was run. Live rules already contain the separately approved CTU/study-session/grade-book changes; this startup task did not deploy rules or Hosting.
