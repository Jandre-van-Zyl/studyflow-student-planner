# Cloud setup status - 19 October 2026

## Verified

- Project: `studyflow-ctu-capstone`, display name StudyFlow CTU Capstone, in Jandre's signed-in Google account. Its overview shows Spark, No-cost ($0/month).
- Jandre explicitly approved project creation with Gemini and Analytics off and no billing account. Both optional toggles were observed off before creation. The console can still show Gemini promotional prompts.
- Web application: StudyFlow Web, registered with separate explicit approval. The Hosting checkbox was left off.
- The four public SDK settings were saved in the ignored local `.env.cloud.local`. No administrator credential, password or personal student address was committed.
- `npm run build:cloud` succeeds with that issued configuration. A temporary local `preview:cloud` rendered the sign-in page; directly opening `/planner` while signed out returned to `/account`. The temporary preview was stopped.

These checks prove project/app registration, configuration and frontend startup. They do not prove working Authentication, an existing database, email delivery, approved membership, cloud persistence, deployed rules or a public website. No test account was created in the cloud.

## Zero-spend boundary

The permitted spend is **zero**. Keep Spark and do not link a Cloud Billing account or upgrade to Blaze. Use only the agreed email/password Authentication, Firestore Standard and classic static Firebase Hosting within their Spark quotas. Do not enable App Hosting, Functions, Storage uploads, SMS authentication or paid services. A budget alert is not a substitute for this boundary. If a quota or required service prevents the demo, retain the local emulator/video fallback rather than enabling billing.

Official sources checked 19 October 2026: [Firebase pricing](https://firebase.google.com/pricing) and [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).

## Pending setup

1. Authorize and enable Email/Password with a compatible password policy. Keep unused providers off; verify safe error handling and actual email templates/domains.
2. Confirm an available database location and create the default Firestore Standard database with locked production rules. Do not enable test mode.
3. The verified-email plus team-approved-list policy is implemented locally. Complete its actual cloud rollout and maintain genuine approved entries outside app-client writes. See [student access setup](STUDENT_ACCESS.md). Local tests do not establish deployed enforcement.
4. Run relevant rules/integration checks before deploying reviewed rules/indexes to this exact project. Confirm real cloud flows with synthetic records.
5. Obtain the applicable Hosting release approval, publish the verified cloud bundle, and test its HTTPS URL from another device while local services are stopped.

The owner/backup-admin agreement, supervisor acceptance of Firestore evidence, teammate access and real submission receipts remain separate outstanding administration. Do not grant broad administrator access to solve an application-login problem.

Read the [release workflow](CLOUD_RELEASE.md) and [build verification](../testing/Cloud_Release_Verification_2026-10-19.md). Private screenshots/logs live in Jandre's persistent planning execution folder.
