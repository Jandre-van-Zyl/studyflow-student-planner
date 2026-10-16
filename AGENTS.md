# StudyFlow repository guidance

README, CONTRIBUTING and docs/development are the current bootstrap/run contract. docs/planning preserves the earlier proposed product baseline. Direct user instructions override these guidelines.

- Main is integration; personal branches are dewald, aneesah, riaan, jandre and omphemetse. Inspect status/remotes before changes. Preserve unrelated work and shared history.
- Keep one root React/TypeScript app, npm and package-lock.json. Selected dependencies need Node 24 LTS; no global package install is needed.
- Feature code belongs in src/features, shared contracts in src/shared/types, shared UI in src/shared/components and Firebase initialization in src/lib/firebase. Add only needed files/abstractions.
- Accounts, profile/settings, private-route guards and profile schema/owner rules are implemented. The six-route UI/motion plan is implemented locally; other feature pages have explicitly labelled in-memory interactive previews, not persistent collection services. Read docs/development/UI_HANDOFF.md and docs/development/ACCOUNTS_HANDOFF.md before integration. Module tests do not prove all 35 capstone acceptance cases passed.
- Disabled mode supports layout previews; dev:emulator forces the demo-studyflow local backend. Firestore permits only valid own-profile access; other collections remain denied. Add tested feature schemas rather than opening access. Config files do not authorize cloud accounts, billing or deployment.
- Run npm run check after changes. Account/profile service changes also need npm run test:integration. Rule changes need npm run test:rules and relevant schema/owner cases; UI changes need real browser verification. Report actual outcomes only.
- Every member needs genuine contributions. Assistant-assisted bootstrap from Jandre's account does not manufacture anyone else's evidence. Never invent research, approval, signatures, test results or submission.
- Dewald leads; Aneesah takes minutes. Technical ownership remains proposed. Group 1 students are the client; record actual proposal and Firestore assessment feedback.

## ECC workflows

Jandre approved ECC's native Codex plugin setup on 16 October 2026. Each teammate needs their own installation; these repository instructions do not install it. Use only relevant, available skills:

- frontend-patterns for React components, state, forms and responsive behaviour; security-review for auth, input and data ownership changes; tdd-workflow for meaningful behavioural changes; verification-loop before reporting code completion.
- Adapt workflows to this repository's npm commands, shared Firebase client, profile lifecycle and emulator tests. Generic skill examples do not authorize new dependencies, a different backend, unrelated coverage work or unsupported commands. Use e2e-testing only if a browser test suite is deliberately selected.
- Preserve direct user instructions and working behaviour. Publishing, hook trust, new services, background automation and delegation require their own applicable authorization. ECC does not override the current keep-local decision.
- On Jandre's machine, reload C:/Users/USER-PC/Desktop/capstone planning/README.md and project/CURRENT_STATE.md before substantive capstone work. The local UI/motion specification is project/UI_Design_Guide.md version 0.2. Jandre directly authorized its implementation on 16 October; the old planning-only boundary is superseded. Keep the stack minimal and preserve the honest preview/persistence boundary. Other members should use repository design/handoff records and the group's reviewed copies.
- Load skills when their task fits; do not apply every installed workflow to every request. After work, report actual checks and limitations and update the persistent project notes. Installation is distinct from runtime skill discovery and verified connector access.
