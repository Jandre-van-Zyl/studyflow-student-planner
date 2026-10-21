# Team setup and manual testing

Current command contract, 21 October 2026. This supersedes older emulator-first startup instructions.

## First setup

Install Node24 LTS (24.15–24.x). Install Java21+ for automated tests only. No global Firebase CLI installation or Firebase login is needed.

On your own branch, commit/stash your work before merging Main. Do not reset or overwrite another member's work.

```powershell
git fetch origin
git switch your-branch-name
git merge origin/Main
npm ci
npm run dev
```

Replace your-branch-name with dewald, aneesah, riaan, jandre or omphemetse. Resolve any real merge conflicts before continuing. The branch permission does not mean local code is already up to date.

## Manual testing with the real backend

`npm run dev` opens **http://127.0.0.1:4173/account**. The website runs locally; Auth/Firestore use the shared studyflow-ctu-capstone project. The checked-in `.env.cloud` contains public browser settings, not admin credentials. Do not create a service-account file or copy Jandre's local environment/credentials. Existing `.env.cloud.local` overrides can be removed manually if they target a different project; never share secrets.

1. Give Jandre your CTU email so he can add it to the approved-student list. Registration alone does not grant planner access.
2. Create your own StudyFlow account using that address and a new app-only password. Verify the email, then click Check access again. Check Junk/Spam if needed.
3. Complete study-routine setup. Confirm the same budgets appear in Settings and the weekly planner after reload.
4. Create a subject prefixed TEST, an assessment with a future due date, and a15-minute study block. Edit, filter, reload and verify the same records remain. Archive/cancel your own test records afterward.
5. If using CTU sync, build the helper with `npm run build:ctu-helper`, load extension-dist/ctu-sync in a supported desktop browser's extension developer page, and use Connect CTU. Sign in to your own CTU account. Helper is limited to this exact loopback origin; localhost and5173 are different origins. Installed helper changes require manual Reload in the browser extension page.
6. Confirm CTU modules/dates and upload checks. Completion is a personal decision; only click it for work you actually consider finished. A second sync must preserve personal progress.
7. Grade book: import your own downloaded Letter of Results and Progress Report, choose its academic year, check the figures and reload. Only numeric Overall marks count in the unweighted module average; pending is not zero. Automatic academic-record extension sync is not implemented yet.
8. Schedule an eligible incomplete assessment's study block near the current time. Open the reminder, select the block, Start, Pause and Save studied time. Confirm recorded time in the planner; paused time must not count. Desktop notification permission is optional. Keep the app open; closed-browser reminders are not supported.
9. Sign out and verify private routes request sign-in. Never use someone else's password or ask for console access to test ownership. Report the page, steps, expected/actual result and a screenshot with private details hidden.

These are real backend writes to your account. They are not the automated synthetic test database. The app does not grant Firebase administration. Do not change real grades, official CTU submissions or another student's data.

If port4173 is busy, stop your existing StudyFlow process with Ctrl+C first. Do not silently move to another port if testing the helper. Ctrl+C stops only the local Vite website; shared Firebase remains running.

## Automated tests: isolated local backend

```powershell
npm run test
```

This starts local Auth and the Java-based Firestore emulator on loopback under **demo-studyflow**, runs app tests, rules tests and Auth/Firestore integration tests, then stops the emulators. It does not use the real cloud backend, approved-student list, CTU portal or private PDFs. Synthetic users and records are disposable. Java runs the Firestore emulator; it is not a separate Spring/Java application backend.

For a fast frontend-only check: `npm run test:unit`. For the full pre-merge gate: `npm run check` then `npm run test`. No Firebase deployment command is included. A first emulator run may download Google's emulator files.

For optional manual emulator testing: `npm run dev:local` opens5173/account with isolated synthetic accounts. Follow STUDENT_ACCESS.md for emulator verification and `demo:approve`. This mode cannot test real CTU admission or the4173-only helper. Close other emulator processes before running npm test.

## Permissions and merge boundary

GitHub Write access permits member-branch work; it does not grant Google Cloud IAM or Firebase console/deploy access. Live data access remains enforced by verified email, active approved membership, owner UID and schema/revision rules. App code cannot self-add an approved student or modify rules through the client SDK. Members can propose edits to firebase/firestore.rules in PRs; only an authorised Firebase administrator can deploy them.

Never commit admin SDK/service-account keys, Firebase CLI tokens, private PDFs, passwords or .env.*.local. Browser API settings are intentionally public and cannot replace database rules. CI runs tests with read-only GitHub permissions and has no Firebase deployment step. Jandre/Dewald review Main changes. Firebase IAM grants must remain separate from GitHub membership; this document does not grant anyone a console role.
