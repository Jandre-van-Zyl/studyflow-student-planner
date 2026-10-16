# Accounts / foundation

Proposed owner Jandre; FR-01 and shared privacy/data-quality NFR. AccountPage is a labelled starter, not working auth.

Add registration/sign-in/out, current-user context, profile setup and listener/state cleanup. Keep new components/services/hooks/tests here. Reuse shared types and getFirebaseServices; do not initialize another Firebase app. Coordinate owner/schema rules with all modules. Share the profile service with settings. Use the demo emulator for local work.

First acceptance: real local sign-in -> own profile -> sign-out clears state, with foreign/anonymous access and invalid-field tests.
