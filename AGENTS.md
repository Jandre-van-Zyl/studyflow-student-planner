# StudyFlow repository guidance

README, CONTRIBUTING and docs/development are the current bootstrap/run contract. docs/planning preserves the earlier proposed product baseline. Direct user instructions override these guidelines.

- Main is integration; personal branches are dewald, aneesah, riaan, jandre and omphemetse. Inspect status/remotes before changes. Preserve unrelated work and shared history.
- Keep one root React/TypeScript app, npm and package-lock.json. Selected dependencies need Node 24 LTS; no global package install is needed.
- Feature code belongs in src/features, shared contracts in src/shared/types, shared UI in src/shared/components and Firebase initialization in src/lib/firebase. Add only needed files/abstractions.
- Current feature pages are honestly unfinished. Bootstrap tests do not prove the 35 planned capstone acceptance cases passed.
- Disabled mode supports UI work; demo-studyflow emulators support local integration. Firestore initially denies all. Do not open access to bypass a failure. Config files do not authorize cloud accounts, billing changes or deployment.
- Run npm run check after changes. Rule changes need npm run test:rules and relevant owner/schema cases; UI changes need real browser verification. Report actual outcomes only.
- Every member needs genuine contributions. Assistant-assisted bootstrap from Jandre's account does not manufacture anyone else's evidence. Never invent research, approval, signatures, test results or submission.
- Dewald leads; Aneesah takes minutes. Technical ownership remains proposed. Group 1 students are the client; record actual proposal and Firestore assessment feedback.
