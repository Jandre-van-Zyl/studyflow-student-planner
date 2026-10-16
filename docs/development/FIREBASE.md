# Firebase development setup

The bootstrap creates no cloud project, accounts, billing plan or deployment. All members can start the UI independently.

## UI-only default

Copy .env.example to .env.local once. Keep `VITE_FIREBASE_MODE=disabled` and run `npm run dev`. Routes work; accounts/data operations are not implemented. A rendered screen does not prove Firebase connectivity or saved data.

## Local emulators

Use Java 21+; verify with `java -version`. npm ci installs the Firebase CLI locally. Do not install it globally or run firebase init over the committed configuration.

Terminal 1 at repository root:

```powershell
npm run emulators
```

The first run may download Google's emulator artifacts. This explicitly uses **demo-studyflow**: Auth 127.0.0.1:9099, Firestore 127.0.0.1:8080, UI http://127.0.0.1:4000. No Firebase login or real project is required. Ctrl+C stops it; local disposable data is not a cloud backup.

Change your ignored .env.local:

```dotenv
VITE_FIREBASE_MODE=emulator
```

Terminal 2:

```powershell
npm run dev
```

Restart Vite after environment changes. getFirebaseServices in src/lib/firebase/client.ts initializes the SDK lazily when a future feature calls it. Emulator mode ignores cloud values and forces the demo project. Auth/forms/services still need implementation; no sign-in/data is invented.

### Rule tests

With no other process using the Firestore emulator port:

```powershell
npm run test:rules
```

The CLI starts a temporary emulator, runs firebase/tests/firestore.rules.test.ts and stops it. Do not run this while npm run emulators owns the same port. Initial rules intentionally deny all access. Tests verify that guard. When implementing owner schemas, extend cases for valid own data, anonymous/foreign access and malformed writes. Do not remove permission tests to force a pass.

## Shared cloud later

Agree a project owner, required assessment acceptance and participant/data handling before actual cloud setup. No cloud project is required for the starter. Normal onboarding has no deployment command.

When an authorized project/web app exists, put its public web configuration in each ignored .env.local:

```dotenv
VITE_FIREBASE_MODE=cloud
VITE_FIREBASE_API_KEY=the-public-web-config-value
VITE_FIREBASE_AUTH_DOMAIN=the-public-web-config-value
VITE_FIREBASE_PROJECT_ID=the-public-web-config-value
VITE_FIREBASE_APP_ID=the-public-web-config-value
```

These are explanatory examples, not issued credentials. All four are required. VITE variables enter the browser bundle: never use passwords, private/service-account keys or Admin SDK credentials. Auth and security rules enforce access. Keep the deny-all guard until valid owner rules are ready. Deploy only with separate authorization.

firebase.json contains the future static Hosting rewrite and local config. No .firebaserc selects a real project and no deploy workflow exists. The current rules do not support planned CRUD.

Sources: [web setup](https://firebase.google.com/docs/web/setup), [emulators](https://firebase.google.com/docs/emulator-suite/install_and_configure), [demo projects](https://firebase.google.com/docs/emulator-suite/connect_and_prototype), [rules tests](https://firebase.google.com/docs/firestore/security/test-rules-emulator).
