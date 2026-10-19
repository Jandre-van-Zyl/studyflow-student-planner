# Verified student access

Implemented locally, 19 October 2026. Private profiles and planner data require a verified Firebase email and an active entry on the team-approved student list. A matching domain alone is insufficient. Team approval is not independent proof of enrolment or CTU institutional approval.

## Local testing

1. Run `npm run dev`. Auth/Firestore start together and the app opens `/account`.
2. Register a disposable address such as `student@example.test` with a test-only password. There is no seeded account. Profile creation waits for admission.
3. Click **Send verification email**. Open the local verification URL printed in the emulator terminal, then return to the app and click **Check access again**. The emulator does not send real email.
4. In a second terminal at the repository root, approve that same synthetic address:

```powershell
npm run demo:approve -- student@example.test
```

The helper writes only to the loopback `demo-studyflow` Firestore emulator on its configured port. It cannot select a cloud host/project, verify email, create an account or change billing. It shares the app's normalization helper. The approval listener opens the workspace automatically; **Check access again** remains available for recovery.

5. Save a profile budget/subject, refresh and confirm data returns. To test revocation:

```powershell
npm run demo:approve -- student@example.test --revoke
```

The private workspace closes. Records are retained and become accessible when approval is restored. Ctrl+C stops everything; local accounts, approvals and records disappear on backend shutdown. Repeat these steps after restarting. `dev:preview` remains a labelled, disconnected layout preview.

## Cloud administration and rollout

Cloud provider/database setup and deployment remain pending. Do not use the local helper for cloud administration or relax rules to fix a denial. After applicable authorization, a trusted project administrator maintains `approvedStudents/{normalizedEmail}` in the correct project's Firestore console with exactly one Boolean field, `active`. Confirm the exact address belongs on the team's list. Use lowercase, trim outer input whitespace, preserve dots/plus tags, and follow the [access contract](../design/Student_Access_Contract.md).

No names, student numbers, passwords or role fields belong in these documents. Keep real addresses out of source, fixtures and screenshots. No student needs project-administrator access to use the planner. Set `active` to false to suspend access while retaining data. Students cannot write or enumerate this collection; verified users can get only their own status. Missing, malformed and inactive entries deny private access.

Existing accounts must verify and receive genuine approval before reopening their records. No data migration/deletion is required. Do not deploy these rules separately from the corresponding app UI. Test cloud verification emails only with approved recipients; emulator links do not prove real delivery. Keep Spark without billing; no paid service is needed for this policy.

## Engineering behaviour

- `authService` observes ID-token changes, reloads the current user and forces fresh claims on recheck. An identity change during refresh is ignored. Email sending is explicit so a delivery failure cannot disguise successful account creation.
- `membershipService` accepts only exact, server-confirmed active approval. Cached/pending approval cannot unlock data. The listener remains active; revocation/errors clear private state and stop profile/planner listeners. Cache-only connections time out with retry.
- `AuthProvider` retains generation/UID guards and prevents profile retry from bypassing admission. The chosen display name survives verification within the current session. It is not stored before admission; after a new session a default may be used and can be changed in Settings.
- Recovery controls support explicit send, recheck, sign-out, duplicate-request protection and a 60-second resend cooldown. Firebase's service limits still apply; the UI cooldown is not a server rate-limit guarantee.
- Firestore checks membership on each private operation while retaining ownership/schema/reference/timestamp checks. Direct SDK calls cannot bypass it. Revocation prevents subsequent access; it cannot erase information already viewed or copied.

Run `npm run check`, `npm run test:rules` and `npm run test:integration`. See [cloud status](CLOUD_PROJECT_STATUS.md) for outstanding live setup. No new dependency, global installation, billing account or paid service was added.

Sources checked 19 October: [Firebase user management](https://firebase.google.com/docs/auth/web/manage-users), [Auth SDK](https://firebase.google.com/docs/reference/js/auth), [Auth emulator](https://firebase.google.com/docs/emulator-suite/connect_auth), [rule conditions](https://firebase.google.com/docs/firestore/security/rules-conditions).
