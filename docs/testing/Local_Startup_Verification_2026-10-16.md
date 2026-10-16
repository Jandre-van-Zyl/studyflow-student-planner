# One-command local startup

16 October 2026. Jandre requested that `npm run dev` start the emulators and begin at login/sign-up. Baseline: clean local jandre 68fd135. No application auth/session, planner data, rules, dependency version, lockfile, cloud or system-setting changes.

## Change

- `dev`: installed Firebase CLI `emulators:exec --project demo-studyflow --only auth,firestore --ui`, running `npm run dev:emulator` after backend readiness. One terminal owns the app/backend lifecycle.
- `dev:emulator`: Vite forced emulator mode on 127.0.0.1:5173 with `--open /account`, opening the existing sign-in screen and its Create an account switch. Private route guards and same-tab refresh/session behaviour remain intact; no forced sign-out on page reload.
- `dev:preview`: Vite layout mode, explicitly forcing disabled Firebase for synthetic layout work without Java/backend. Normal build configuration is unchanged.
- Java 21+ remains required for Firestore. Do not run a separate emulator alongside the default command. Ctrl+C stops its app/backend. Emulator data remains disposable; no export/import was added.

## Executed verification

The first combined launch encountered an old StudyFlow Vite process on 5173. Firebase shut down its newly started emulators after the child failed, without leaving backend listeners. The identified process command pointed to this exact repository; only that old Vite process was stopped before retrying.

Clean retry: Auth 9099, Firestore 8080, emulator UI 4000 and app 5173 listened on loopback. The launcher log showed backend startup before `vite --mode emulator ... --open /account`. HTTP `/account` returned 200 with the application root. The served client module's Firebase mode was `emulator`. An initial string check omitted the JSON key quotes and returned false; corrected extraction confirmed the actual mode rather than treating the check as an application defect.

Ctrl+C ended the combined command; app, backend, UI, hub and websocket ports were checked closed. `npm run dev:preview` separately served Firebase mode `disabled` with no backend listeners, then was stopped. Browser auto-opening was suppressed during the launcher test using process-local `BROWSER=none`; no global environment/config setting was changed. Actual browser auto-opening was not manually rechecked; the installed Vite CLI flag selects the existing `/account` route, whose sign-in/register flows remain covered by the app tests.

Final `npm run check` covers formatting, lint, TypeScript, app tests and production build. Rules and backend integration suites are not rerun for this startup/config-only change. Exact final result/commit is recorded in the persistent project notes. No new mirror tests or dependency was introduced for these reversible script changes.

References: installed Firebase CLI command implementation and [Firebase emulator lifecycle](https://firebase.google.com/docs/emulator-suite/install_and_configure); installed Vite CLI and [Vite open behaviour](https://vite.dev/config/server-options.html#server-open). Current run instructions: [Firebase setup](../development/FIREBASE.md) and [planner handoff](../development/PLANNER_HANDOFF.md).
