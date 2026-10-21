# CTU account saving: live activation

21 October 2026. Jandre explicitly approved publishing the tested CTU database rules and enabling saving in the local app. Implementation baseline: `8685a4ff33e6cbca31bc32212a87e69019c7032b`.

## Changes applied

- Compared the deployed Firebase rules with the existing `946018d` planner baseline through the signed-in console. They matched after newline normalization; no independent live rule changes were overwritten.
- Published the exact tested `firebase/firestore.rules` to the default database in `studyflow-ctu-capstone`. Console history displayed the active version as **Today, 2:23 PM**. The file SHA-256 is `a9b93e4f47109231c5ff3348bbc29310b38a44f15460e6f6c3a741d8563d7d02`.
- Added only the CTU source, connection and planner-link rules. Existing approved-student, verified-email, ownership, schema and planner checks remain unchanged; unknown paths and hard deletes remain denied.
- Set `VITE_CTU_SAVE_ENABLED=true` in the prototype's ignored `.env.cloud.local`, rebuilt using `npm run build:cloud` and reloaded the existing local app at `http://127.0.0.1:4173/ctu-sync`.
- Firebase remains Spark, with the console displaying no-cost billing. No Hosting release, GitHub push, new user approval or extension permission change occurred. The Firebase CLI is not signed in; deployment used the existing browser console.

## Live verification

The real signed-in account used the installed helper to collect from its existing CTU session. No password or Firebase token was exposed to the helper.

1. First sync: **26 new, 0 updated, 0 unchanged**. The saved view showed five deadlines, eight modules and thirteen resource/document entries. First collection displayed 14:24:29 SAST.
2. Navigated to Dashboard: the five saved source deadlines and deadline counts appeared.
3. Returned to Connect CTU: five deadlines and eight modules remained available.
4. Reloaded the page: both counts remained available from the account without another collection.
5. Repeated collection: **0 new, 0 updated, 26 unchanged**, with no error alert.

`npm run build:cloud` passed TypeScript and production bundling. Existing code/rules were unchanged from the prior 223 application, 119 rules and 20 integration test checkpoint; those suites were not rerun for this configuration-only activation. Browser console inspection after reload returned no error entries.

## Remaining boundaries

- This live check validates collection, account saving, reload/navigation and repeat-source deduplication. Fresh sign-out/sign-in, second-device access and two-real-account isolation were not exercised in this activation; local emulator coverage is recorded separately.
- No personal effort, task completion or study sessions were invented during the test. Use **Plan this assessment** to supply type, remaining study time and any missing deadline time. That activates an ordinary assessment for recommendations, workload totals and weekly planning. This link workflow was previously verified with emulators; no new real planning task was created here.
- An observed CTU upload does not mark a task complete. Missing items from partial collections are retained. PDF timetable/calendar links remain unparsed.
- The original Desktop checkout and teammates' branches are unchanged. This feature remains on the local prototype branch; another checkout needs the code and its own configuration.

## Recovery

The previous live rules remain in Firebase console history under 19 October, 1:53 PM. If saving needs to be paused, set the ignored cloud-save flag to `false` and rebuild/reload the local app. That hides saved CTU views but does not erase records. Reverting live rules requires an explicitly approved external change and temporarily makes the CTU collections inaccessible to the client; preserve stored records.
