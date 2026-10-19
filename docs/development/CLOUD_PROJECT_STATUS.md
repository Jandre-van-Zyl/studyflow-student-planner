# Cloud setup status - 19 October 2026

## Verified

- Project: `studyflow-ctu-capstone`, display name StudyFlow CTU Capstone, in Jandre's signed-in Google account. Its overview shows Spark, No-cost ($0/month).
- Jandre explicitly approved project creation with Gemini and Analytics off and no billing account. Both optional toggles were observed off before creation. The console can still show Gemini promotional prompts.
- Web application: StudyFlow Web, registered with separate explicit approval. The Hosting checkbox was left off.
- The four public SDK settings were saved in the ignored local `.env.cloud.local`. No administrator credential, password or personal student address was committed.
- `npm run build:cloud` succeeds with that issued configuration. A temporary local `preview:cloud` rendered the sign-in page; directly opening `/planner` while signed out returned to `/account`. The temporary preview was stopped.

## Live backend configured, 19 October

With Jandre's explicit approval, Email/Password was enabled and an enforced 8–128-character password policy saved. Passwordless/SMS/other providers were not enabled. Email enumeration protection was already on and remains on. The default authorized domains are localhost and this project's firebaseapp.com/web.app hosts.

The default Firestore Standard database was created in `africa-south1` (Johannesburg), initialized with production deny-all rules and no scheduled backups. The tested rule source from local commit `7e3b7b5` was then published through the Firebase console. The full persisted editor contents were compared to the approved local source after reload, normalizing line endings/trailing newline only: they match. Source SHA-256: `958a9f49993d748c61a582125baffb1ff135b66adacac52541dfebc290f4337c`. Console history retains the original deny-all version and the 19 October 13:53 SAST published version.

Only Jandre's explicitly approved address was entered privately with exactly Boolean `active: true`; the actual address stays out of source and shared evidence. Zero manual/composite indexes and zero field exemptions were observed, matching the repository's empty index configuration. No index modification was needed.

These checks establish configuration and persisted rules, not successful real mailbox verification, authenticated cloud saves, multi-account isolation or a public website. The agent created no cloud Auth account. A human password/mailbox handoff is pending. The local Firebase CLI has no authorized account; rules were published through the console without creating CLI OAuth credentials.

## Zero-spend boundary

The permitted spend is **zero**. Keep Spark and do not link a Cloud Billing account or upgrade to Blaze. Use only the agreed email/password Authentication, Firestore Standard and classic static Firebase Hosting within their Spark quotas. Do not enable App Hosting, Functions, Storage uploads, SMS authentication or paid services. A budget alert is not a substitute for this boundary. If a quota or required service prevents the demo, retain the local emulator/video fallback rather than enabling billing.

Official sources checked 19 October 2026: [Firebase pricing](https://firebase.google.com/pricing) and [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).

## Pending setup

1. Jandre enters his own app-only password and verifies his approved address using his mailbox. Confirm actual signup, delivery, recheck and workspace admission; never collect his password or verification link in chat.
2. Verify real cloud profile/planner save/reload and direct unauthorized/foreign-account denial using authorized synthetic records/accounts. Existing local tests and published text are not substitutes for these live outcomes.
3. Maintain only genuinely confirmed additional membership entries after applicable approval. See [student access setup](STUDENT_ACCESS.md). No domain wildcard, auto-approval or new administrator grant is implied.
4. Retain the tested source/rule revision and real cloud results, inspect quotas, and recheck the final candidate before publication. Keep all unused paid services disabled.
5. Obtain the applicable Hosting release approval, publish the verified cloud bundle, and test its HTTPS URL from another device while local services are stopped.

The owner/backup-admin agreement, supervisor acceptance of Firestore evidence, teammate access and real submission receipts remain separate outstanding administration. Do not grant broad administrator access to solve an application-login problem.

Read the [release workflow](CLOUD_RELEASE.md) and [build verification](../testing/Cloud_Release_Verification_2026-10-19.md). Private screenshots/logs live in Jandre's persistent planning execution folder.
