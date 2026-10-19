# Cloud release workflow

Prepared 19 October 2026. The local cloud-build boundary is implemented. Project/web-app registration and a configured frontend build are now verified; account policy, database, deployed rules and live Hosting remain pending. Read [current cloud setup status](CLOUD_PROJECT_STATUS.md). No cloud resource is created by building this app.

## Separate local development from the cloud release

| Command                 | Backend and output                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`           | Starts local Auth/Firestore and Vite, forces emulator mode and opens /account.                                              |
| `npm run dev:preview`   | Forces the labelled layout-only preview; no account/backend.                                                                |
| `npm run check`         | Checks format/lint/types/app tests and builds the default mode into dist.                                                   |
| `npm run build:cloud`   | Requires valid explicit cloud configuration and builds into dist-cloud.                                                     |
| `npm run preview:cloud` | Serves the existing dist-cloud bundle at http://127.0.0.1:4173. It validates configuration but does not rebuild the bundle. |

Firebase Hosting reads **dist-cloud**, so an ordinary check/default build cannot overwrite its release files. Always rebuild the cloud output after a source or cloud-configuration change; previewing an older bundle does not update its embedded settings.

## Configure the agreed project

Select the human-owned project before configuring the app. Do not rerun firebase init, add a second Firebase app or replace the existing rules. Create an ignored `.env.cloud.local` at the repository root with the actual public web settings:

```dotenv
VITE_FIREBASE_MODE=cloud
VITE_FIREBASE_API_KEY=copy-the-public-web-config-value
VITE_FIREBASE_AUTH_DOMAIN=copy-the-public-web-config-value
VITE_FIREBASE_PROJECT_ID=copy-the-approved-project-id
VITE_FIREBASE_APP_ID=copy-the-public-web-config-value
```

The example is not an issued configuration. The cloud command rejects missing fields, a non-cloud mode or demo-studyflow as the project. It does not prove a supplied key/project exists: real login/save/reload must still be checked. Process-level environment variables take priority over env files. The ordinary dev commands still force their local modes even if cloud settings exist.

Firebase web configuration is public in a browser bundle and does not grant database access. Never put service-account keys, Admin SDK credentials, user passwords or other private secrets in VITE variables. `.env.cloud.local` remains ignored; verify it with `git check-ignore .env.cloud.local`.

## Check build and publish in order

1. Review the exact source and target project. Preserve unrelated changes. Run npm run check, npm run test:rules and npm run test:integration. Stop only your own development emulator first if its ports conflict with backend tests.
2. Enable the agreed Authentication provider/policy and deploy the reviewed Firestore rules/indexes to the actual project with the local Firebase CLI and explicit --project selection. Keep the database locked down until its intended rules are deployed.
3. Build and preview:

```powershell
npm run build:cloud
npm run preview:cloud
```

4. Confirm the runtime uses the intended cloud project, all six direct routes work, real synthetic account saves survive refresh and a second account is isolated. No emulator is required for the cloud preview. The preview can write to the real selected backend; use synthetic records.
5. Stop the preview. After the applicable explicit publication approval, use the repository-local Firebase CLI with `deploy --only hosting --project` and the actual selected project ID. Record the source SHA, build configuration identity, rules revision, Hosting release and URL. Do not publish the synthetic configuration used for build tests.
6. Test the returned HTTPS URL from a second device while local app/emulators are stopped. Preserve a known working release and a documented local/video fallback.

The code uses strict Firebase chunk execution ordering. Keep that setting when changing build output. Hosting rollback restores a frontend version, not user data or rules. No automatic deploy job, paid billing feature or tested cloud backup is added here.

## Membership status

Verified email plus the team-approved list is implemented and tested locally in the app and rules. Follow [student access setup](STUDENT_ACCESS.md). Cloud enforcement remains pending provider/database setup and deployment of the reviewed app/rules together. Actual addresses belong in private administration, not committed fixtures/screenshots. Team approval is not independent proof of CTU enrolment.

## References

- [Vite environment files and modes](https://vite.dev/guide/env-and-mode)
- [Firebase Hosting](https://firebase.google.com/docs/hosting/quickstart)
- [Firebase API keys](https://firebase.google.com/docs/projects/api-keys)

Read [FIREBASE.md](FIREBASE.md), [SETUP.md](SETUP.md) and the [planner contract](../design/Planner_Data_Contract.md) for the existing development and data boundaries.
