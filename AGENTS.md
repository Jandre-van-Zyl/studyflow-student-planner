# StudyFlow repository guidance

README, CONTRIBUTING and docs/development are the current bootstrap/run contract. docs/planning preserves the earlier proposed product baseline. Direct user instructions override these guidelines.

- Main is integration; personal branches are dewald, aneesah, riaan, jandre and omphemetse. Inspect status/remotes before changes. Preserve unrelated work and shared history.
- Keep one root React/TypeScript app, npm and package-lock.json. Selected dependencies need Node 24 LTS; no global package install is needed.
- Feature code belongs in src/features, shared contracts in src/shared/types, shared UI in src/shared/components and Firebase initialization in src/lib/firebase. Add only needed files/abstractions.
- Accounts, profile/settings, private-route guards and profile schema/owner rules are implemented. Other feature pages remain unfinished. Read docs/development/ACCOUNTS_HANDOFF.md before integration. Module tests do not prove all 35 capstone acceptance cases passed.
- Disabled mode supports layout previews; dev:emulator forces the demo-studyflow local backend. Firestore permits only valid own-profile access; other collections remain denied. Add tested feature schemas rather than opening access. Config files do not authorize cloud accounts, billing or deployment.
- Run npm run check after changes. Account/profile service changes also need npm run test:integration. Rule changes need npm run test:rules and relevant schema/owner cases; UI changes need real browser verification. Report actual outcomes only.
- Every member needs genuine contributions. Assistant-assisted bootstrap from Jandre's account does not manufacture anyone else's evidence. Never invent research, approval, signatures, test results or submission.
- Dewald leads; Aneesah takes minutes. Technical ownership remains proposed. Group 1 students are the client; record actual proposal and Firestore assessment feedback.
