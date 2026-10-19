# Student access contract v1

19 October 2026. Jandre owns accounts/security; all feature modules consume the existing `ready` session boundary. The shared TypeScript type in `src/shared/types/membership.ts` is authoritative for the new administrative document. Runtime parsing and Firestore rules must agree. This is a capstone team's approved list, not independent confirmation of CTU enrolment or institutional approval.

## Administrative document

`approvedStudents/{email}` contains exactly `{ active: boolean }`. The ID is a lowercase ASCII email address, at most 254 characters, matching `[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}`. Outer whitespace is trimmed in administrative input; token emails must already be free of whitespace. Do not remove dots, plus tags or other meaningful characters. No address domain grants access by itself. The administrator must confirm that the exact supplied address belongs on the team's list.

Only a trusted project administrator may maintain entries outside app-client writes. Students may get their own entry only when their Firebase token has `email_verified == true` and its normalized email equals the requested ID. No student can list, create, update or delete membership documents. Missing entries, extra fields, wrong types and `active: false` deny private access. The list contains no names, student numbers, roles or private notes.

Every profile/planner operation requires both ownership and verified active membership. Existing schema/reference/revision/timestamp constraints remain. There is no emulator-mode bypass in the rules. Deactivation retains data but prevents subsequent access; it does not delete the Auth account or revoke the Google administrator's privileges.

## Session and interface

Unverified users see verification instructions, an explicit send/resend action, a refresh/recheck action and sign out. No verification email is sent automatically on registration, preventing email-send failure from disguising successful account creation. Verified users wait for a server-confirmed membership snapshot before profile setup. Missing/inactive/malformed entries show a pending approval message. Connection failures fail closed with explicit retry. A membership listener remains active after admission so revocation clears private UI/listeners; offline cached approval is insufficient.

The application refreshes the signed-in user and its token when rechecking verification. Account changes, sign-out, token changes, unmount and stale callbacks must never revive a previous workspace. Profile retry is permitted only while the current session has verified active membership. Registration display names survive the verification/approval step in the current session; they are not persisted before admission and may need re-entry after a new tab/session.

## Development and rollout

Use identical policy in emulators. Developers explicitly approve synthetic addresses in the local emulator, send an emulator verification message and follow its local verification link. No account is seeded automatically, and no production credentials enter source code. Existing unverified accounts will be gated after this change; keep their data and admit them through verification and a genuine approved entry.

Do not deploy this policy until the app, rule suite, Auth integration and browser flow pass. Cloud provider/database setup, approved real addresses and deployment require their applicable authorization. No Functions, Admin SDK package, billing upgrade or paid service is required by this contract.
