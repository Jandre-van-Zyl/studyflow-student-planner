# Accounts and profile foundation

Jandre's implemented local module covers registration, sign-in/out, session persistence, auth/profile context, private-route guards, profile creation/retry and owner/schema security. Check Git/PR status before assuming it is integrated into Main.

Use [the handoff](../../../docs/development/ACCOUNTS_HANDOFF.md) for useAuth/getFirebaseServices contracts and listener cleanup. Profile services are shared with Settings. Use [the design](../../../docs/design/Accounts_and_Profile_Design.md) for the implemented profile schema and sequence diagrams.

Verify with npm run check, npm run test:rules and npm run test:integration, plus browser flows. [Results](../../../docs/testing/Jandre_Accounts_Verification_2026-10-16.md) distinguish actual module checks from outstanding full-planner acceptance. Other entity collections remain closed until their owners add schema/rules tests. No cloud project or deployment is included.
