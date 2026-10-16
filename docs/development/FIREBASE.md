# Firebase development setup

No cloud project, account, billing plan or deployment is created by this module. Local development uses the existing demo-studyflow backend.

## Run the working account/profile module

Use Node 24.15+ within 24.x (pinned 24.19.0), npm 10/11 and Java 21+. Run npm ci once after updating the branch. At the repository root:

```powershell
# Terminal 1
npm run emulators
```

```powershell
# Terminal 2
npm run dev:emulator
```

Open http://127.0.0.1:5173/account. Register a synthetic email/password account, sign in/out, then edit Settings. Never reuse an actual account password for these tests. The command forces emulator mode even if `.env.local` contains cloud configuration. No Firebase login, global CLI or firebase init is needed.

Auth is at 127.0.0.1:9099; Firestore at 127.0.0.1:8080; emulator UI at http://127.0.0.1:4000. The first run may download official emulator artifacts. Ctrl+C stops the services. No import/export is configured: accounts/data are disposable and disappear when the emulators stop. Restarting a browser tab while the emulators are still running preserves that tab's session/profile; stopping the backend is different.

## Modes and sessions

- `npm run dev` respects VITE_FIREBASE_MODE in the environment and defaults to disabled. This is a layout preview: accounts/settings do not pretend to save data.
- `npm run dev:emulator` uses Vite's emulator mode to force demo-studyflow. The app ignores cloud values and connects to loopback Auth/Firestore.
- Cloud mode requires explicit complete public web configuration. A successful local test is not cloud verification.

One shared Firebase app supplies Auth/Firestore. Auth uses browser session persistence: same-tab refresh restores the session; signing out or closing the tab ends it. Profile listeners use confirmed server snapshots and detach on session changes. Private pages wait for a valid profile; failed setup offers retry without registering another account.

## Security and writes

`users/{uid}` permits an authenticated owner to get/create/update a valid profile only. A profile requires a trimmed single-line display name (1-80), fixed Africa/Johannesburg timezone, integer budgets 0-1440 for exactly weekdays 1-7, and server timestamps. createdAt is immutable. Profile listing/deletion and every other collection remain denied.

Other owners must implement/test their entity schema and ownership rules before persistent feature work. Do not add a broad signed-in allow rule. Read the [profile design](../design/Accounts_and_Profile_Design.md) and [shared API handoff](ACCOUNTS_HANDOFF.md).

Profile creation is idempotent. A server-only read precedes a transaction; saves compare the loaded updatedAt inside the transaction to prevent lost edits. Offline failures retain form input and do not report success. A lost acknowledgement after a server commit can make the result uncertain: reload the profile before retrying rather than assuming a failed response means the server did nothing. No Firestore persistent disk cache is enabled.

## Verification

Stop a manually running emulator before executing these commands:

```powershell
npm run check
npm run test:rules
npm run test:integration
```

Rules tests start Firestore and exercise owner/schema enforcement. Integration tests start Auth plus Firestore and exercise real SDK/profile service operations with synthetic local accounts. Each command stops its own emulators. See the [verification record](../testing/Jandre_Accounts_Verification_2026-10-16.md).

## Shared cloud setup later

When an authorized Firebase project/web app exists, enable its email/password provider and configure the agreed password policy. The registration UI requires 8-128 characters; Firebase may reject additional policy violations. Put public web configuration in each ignored `.env.local`:

```dotenv
VITE_FIREBASE_MODE=cloud
VITE_FIREBASE_API_KEY=the-public-web-config-value
VITE_FIREBASE_AUTH_DOMAIN=the-public-web-config-value
VITE_FIREBASE_PROJECT_ID=the-public-web-config-value
VITE_FIREBASE_APP_ID=the-public-web-config-value
```

These are examples, not issued credentials. All four public config values are required. VITE variables enter the browser bundle. Passwords, private keys and service-account/Admin SDK credentials never belong there. No .firebaserc selects a real project and no deploy workflow is configured. Cloud setup/deployment still requires authorization and real integration testing.

Sources: [Firebase Auth](https://firebase.google.com/docs/auth/web/password-auth), [session persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence), [emulators](https://firebase.google.com/docs/emulator-suite/connect_and_prototype), [rules tests](https://firebase.google.com/docs/rules/unit-tests), [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions).
