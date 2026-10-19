# Firebase development setup

No cloud project, account, billing plan or deployment is created by this module. Local development uses the existing demo-studyflow backend.

## Run accounts and the persistent planner

Use Node 24.15+ within 24.x (pinned 24.19.0), npm 10/11 and Java 21+. Run npm ci once after updating the branch. At the repository root:

```powershell
npm run dev
```

This single command starts Auth/Firestore and their UI, waits for readiness, then opens http://127.0.0.1:5173/account for login/sign-up. Register a synthetic account, then use Settings, Subjects, Assessments and Weekly planner. Signed-in records survive browser refresh. Ctrl+C stops the app and backend together. Stop existing servers before running it; do not also start a separate emulator. It forces emulator mode even if `.env.local` contains cloud configuration. No Firebase login, global CLI or firebase init is needed. Never reuse a real password.

Auth is at 127.0.0.1:9099; Firestore at 127.0.0.1:8080; emulator UI at http://127.0.0.1:4000. The first run may download official emulator artifacts. Ctrl+C stops the services. No import/export is configured: accounts/data are disposable and disappear when the emulators stop. Restarting a browser tab while the emulators are still running preserves that tab's session/profile; stopping the backend is different.

## Modes and sessions

- `npm run dev` manages the local backend and app together, forcing demo-studyflow and opening /account.
- `npm run dev:emulator` runs only the frontend in forced emulator mode; advanced users may pair it with a separately started `npm run emulators`.
- `npm run dev:preview` forces disabled mode regardless of local cloud configuration; no backend/account is needed for its labelled layout preview.
- Cloud mode requires explicit complete public web configuration. A successful local test is not cloud verification.

One shared Firebase app supplies Auth/Firestore. Auth uses browser session persistence: same-tab refresh restores the session; signing out or closing the tab ends it. Profile listeners use confirmed server snapshots and detach on session changes. Private pages wait for a valid profile; failed setup offers retry without registering another account.

## Security and writes

`users/{uid}` permits an authenticated owner to get/create/update a valid profile. A profile requires a trimmed single-line display name (1-80), fixed Africa/Johannesburg timezone, integer budgets 0-1440 for exactly weekdays 1-7, and server timestamps. createdAt is immutable. Own planner subcollections now use exact schemas and own-parent references; atomic subjectCodes claims enforce unique codes. Profile listing, hard deletes, foreign access and unknown collections remain denied.

Do not add a broad signed-in allow rule or persist the UI adapter directly. Read the [planner contract](../design/Planner_Data_Contract.md), [planner handoff](PLANNER_HANDOFF.md) and existing [profile design](../design/Accounts_and_Profile_Design.md).

Profile creation is idempotent. A server-only read precedes a transaction; saves compare the loaded updatedAt inside the transaction to prevent lost edits. Offline failures retain form input and do not report success. A lost acknowledgement after a server commit can make the result uncertain: reload the profile before retrying rather than assuming a failed response means the server did nothing. No Firestore persistent disk cache is enabled.

## Verification

Stop a manually running emulator before executing these commands:

```powershell
npm run check
npm run test:rules
npm run test:integration
```

Rules tests start Firestore and exercise owner/schema/reference enforcement. Integration tests start Auth plus Firestore and exercise the actual profile/planner services with synthetic local accounts. Each command stops its own emulators. See the [planner verification](../testing/Planner_Persistence_Verification_2026-10-16.md) and earlier [accounts verification](../testing/Jandre_Accounts_Verification_2026-10-16.md).

## Shared cloud setup later

Use the [explicit cloud release workflow](CLOUD_RELEASE.md). `npm run build:cloud` checks `.env.cloud.local` and writes to `dist-cloud`; `npm run preview:cloud` serves that output. Hosting uses `dist-cloud`, which ordinary builds/checks leave intact. A cloud build is not a deployment or verification of the selected project.

When an authorized Firebase project/web app exists, enable its email/password provider and configure the agreed password policy. The registration UI requires 8-128 characters; Firebase may reject additional policy violations. Put public web configuration in each ignored `.env.cloud.local`:

```dotenv
VITE_FIREBASE_MODE=cloud
VITE_FIREBASE_API_KEY=the-public-web-config-value
VITE_FIREBASE_AUTH_DOMAIN=the-public-web-config-value
VITE_FIREBASE_PROJECT_ID=the-public-web-config-value
VITE_FIREBASE_APP_ID=the-public-web-config-value
```

These are examples, not issued credentials. All four public config values are required. VITE variables enter the browser bundle. Passwords, private keys and service-account/Admin SDK credentials never belong there. No .firebaserc selects a real project and no deploy workflow is configured. Cloud setup/deployment still requires authorization and real integration testing.

Sources: [Firebase Auth](https://firebase.google.com/docs/auth/web/password-auth), [session persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence), [emulators](https://firebase.google.com/docs/emulator-suite/connect_and_prototype), [rules tests](https://firebase.google.com/docs/rules/unit-tests), [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions).
