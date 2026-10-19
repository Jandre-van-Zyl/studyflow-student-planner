# StudyFlow repository guidance

README, CONTRIBUTING and docs/development are the current bootstrap/run contract. docs/planning preserves the earlier proposed product baseline. Direct user instructions override these guidelines.

- Main is integration; personal branches are dewald, aneesah, riaan, jandre and omphemetse. Inspect status/remotes before changes. Preserve unrelated work and shared history.
- Keep one root React/TypeScript app, npm and package-lock.json. Selected dependencies need Node 24 LTS; no global package install is needed.
- Feature code belongs in src/features, shared contracts in src/shared/types, shared UI in src/shared/components and Firebase initialization in src/lib/firebase. Add only needed files/abstractions.
- Accounts, profile/settings, private-route guards, six-route UI/motion and persistent planner collections are implemented locally. Read docs/development/PLANNER_HANDOFF.md and docs/design/Planner_Data_Contract.md before integration. Disabled mode alone uses the labelled in-memory preview; ready authenticated sessions use server-confirmed planner records. Module tests do not prove all 35 capstone acceptance cases passed.
- npm run dev starts local Auth/Firestore and Vite together, opens /account, and forces demo-studyflow. Ctrl+C stops both. dev:emulator runs only Vite for an already running backend; dev:preview forces disabled layout mode. Firestore permits only strictly validated own profile/planner access; unknown paths, foreign access and hard deletes remain denied. Preserve atomic subject-code claims, timestamps, revision conflicts, retained history and UID/listener guards. Config files do not authorize cloud accounts, billing or deployment.
- Run npm run check after changes. Account/profile service changes also need npm run test:integration. Rule changes need npm run test:rules and relevant schema/owner cases; UI changes need real browser verification. Report actual outcomes only.
- Every member needs genuine contributions. Assistant-assisted bootstrap from Jandre's account does not manufacture anyone else's evidence. Never invent research, approval, signatures, test results or submission.
- Dewald leads; Aneesah takes minutes. Technical ownership remains proposed. Group 1 students are the client; record actual proposal and Firestore assessment feedback.

## ECC workflows

19 October student-access update: private profile/planner access requires verified email and an exact active approvedStudents entry, independently enforced in rules. Read docs/design/Student_Access_Contract.md and docs/development/STUDENT_ACCESS.md. Local testing also requires explicit verification/approval; demo:approve targets only the loopback demo-studyflow emulator. Preserve server-confirmed admission, membership revocation and all existing owner/revision/listener guards. No cloud enforcement is implied until app/rules deployment. Maximum spend is zero; never link billing or upgrade to Blaze.

Jandre approved ECC's native Codex plugin setup on 16 October 2026. Each teammate needs their own installation; these repository instructions do not install it. Use only relevant, available skills:

- frontend-patterns for React components, state, forms and responsive behaviour; security-review for auth, input and data ownership changes; tdd-workflow for meaningful behavioural changes; verification-loop before reporting code completion.
- Adapt workflows to this repository's npm commands, shared Firebase client, profile lifecycle and emulator tests. Generic skill examples do not authorize new dependencies, a different backend, unrelated coverage work or unsupported commands. Use e2e-testing only if a browser test suite is deliberately selected.
- Preserve direct user instructions and working behaviour. Publishing, hook trust, new services, background automation and delegation require their own applicable authorization. ECC does not override the current keep-local decision.
- On Jandre's machine, reload C:/Users/USER-PC/Desktop/capstone planning/README.md and project/CURRENT_STATE.md before substantive capstone work. The local UI/motion specification is project/UI_Design_Guide.md version 0.2. Jandre directly authorized its implementation on 16 October; the old planning-only boundary is superseded. Keep the stack minimal and preserve the honest preview/persistence boundary. Other members should use repository design/handoff records and the group's reviewed copies.
- Load skills when their task fits; do not apply every installed workflow to every request. After work, report actual checks and limitations and update the persistent project notes. Installation is distinct from runtime skill discovery and verified connector access.
