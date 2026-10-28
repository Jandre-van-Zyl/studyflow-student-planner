# StudyFlow for CTU

Software Engineering 2 · Group 1 · final release preparation, 28 October 2026.

StudyFlow puts subjects, classes, assessments and study time in one private planner. It uses React, TypeScript, Tailwind CSS and Firebase. CTU sync brings observed portal deadlines, modules, upload indicators and resource links into the student's own account. Grade reports remain separate from active planner tasks.

## Run the app

Use Node 24.15–24.x and npm 10 or 11. The tested version is in `.nvmrc`. No Firebase administrator access or global package installation is needed.

```powershell
npm ci
npm run dev
```

Open **http://127.0.0.1:4173/account**. The website runs locally with the real `studyflow-ctu-capstone` Firebase backend. Register with your own approved CTU email, verify it, return and select **Check access again**. The project owner must add your exact email to the approved list. There is no shared live demo password.

Checked-in `.env.cloud` contains public browser configuration. Never share private `.env.*.local`, passwords, admin keys or academic PDFs. GitHub membership does not grant Firebase administration. Spark/no billing is the cost constraint. Hosting has not been published.

## Update your branch

Preserve unfinished changes first. Replace `aneesah` with `dewald`, `aneesah`, `riaan`, `jandre` or `omphemetse`.

```powershell
git status
git fetch origin
git switch aneesah
git merge origin/Main
npm ci
npm run dev
```

Main is protected; Jandre and Dewald maintain integration. Everyone can pull Main and work on member branches. A Main release does not automatically advance personal branches. Read [team testing and permissions](docs/development/TEAM_TESTING.md).

## Connect CTU

```powershell
npm run build:ctu-helper
```

Load `extension-dist/ctu-sync` as an unpacked extension in a supported desktop Chromium browser, then reload StudyFlow. Select **Connect CTU** in the same browser and sign in on the genuine CTU page. The helper reads only on request; it does not collect passwords or change CTU submissions. Use the exact `127.0.0.1:4173` origin.

- Known deadlines and upload observations remain after reload. Re-sync updates stable records and preserves personal progress.
- Add the remaining work estimate and missing planning details to include an assessment in recommendations and the weekly planner.
- An observed upload and personal completion are distinct states.
- Timetable PDFs remain links; enter class times manually. Grade book accepts downloaded Result and Progress PDFs.
- Build Firefox with `npm run build:ctu-helper -- --firefox`. Build success does not certify browser compatibility. Store distribution and Safari support are not in this release.

## Test without touching the real database

Java 21+ is needed for the Firestore emulator, not an application server.

```powershell
npm run check
npm test
npm run build:cloud
npm run build:ctu-helper
```

`check` runs formatting, lint, TypeScript, unit/component tests and a build. `npm test` starts isolated Auth/Firestore emulators under **demo-studyflow**, runs app, rules and integration tests, then stops them. Close other emulator processes first. Neither command deploys Firebase rules or Hosting.

| Command                    | Use                                                      |
| -------------------------- | -------------------------------------------------------- |
| `npm run dev`              | Local website, real Firebase backend, port 4173          |
| `npm run dev:local`        | Disposable local accounts/backend and website, port 5173 |
| `npm run dev:preview`      | Labelled layout preview without a backend                |
| `npm run test:unit`        | Fast app tests                                           |
| `npm run build:cloud`      | Real-backend build in `dist-cloud`; no deployment        |
| `npm run build:ctu-helper` | Local Chromium helper build                              |

For local accounts, follow [verification and approval](docs/development/STUDENT_ACCESS.md). No account is automatically approved. Ctrl+C stops the local process. Emulator data is disposable; cloud data persists.

## Code and documents

| Location                                         | Purpose                                               |
| ------------------------------------------------ | ----------------------------------------------------- |
| `src/features/auth`, `settings`                  | Student access, profile, onboarding and daily budgets |
| `src/features/subjects`, `assessments`           | Subjects/classes and assessment lifecycle             |
| `src/features/planner`, `dashboard`              | Weekly agenda, clashes, priorities and workload       |
| `src/features/ctu`, `extensions/ctu-sync`        | Portal collection, source data and planner links      |
| `src/features/timer`, `grades`                   | Recorded study sessions/reminders and private grades  |
| `src/shared`, `src/lib/firebase`                 | Shared UI/types and one Firebase client               |
| `firebase`                                       | Security rules, indexes and isolated backend tests    |
| `docs/capstone`, `docs/testing`, `docs/evidence` | Member documents, test records and screenshots        |

Read the [final release record](docs/testing/Final_Release_2026-10-28.md), [planner contract](docs/design/Planner_Data_Contract.md), [current data/scope addendum](docs/design/Release_Data_and_Scope_2026-10-28.md), [architecture](docs/development/ARCHITECTURE.md) and [team setup](docs/development/TEAM_TESTING.md). Dated plans/reports preserve earlier checkpoints.

The core includes FR-01–12, a study timer, CTU source linking and a private grade book. Facilitator class management, quizzes, attendance, CSV export, dark mode, automatic PDF timetable parsing and closed-browser reminders are not implemented. Class activities describes the future facilitator scope.

## Submission and demonstration

Final submission and presentation: **29 October 2026**; confirm the cutoff/slot with the lecturer. Dewald leads; Aneesah takes minutes. The five students are project stakeholders. Preserve each member's actual contribution and evidence.

The group must assemble its six-chapter dissertation, required testing workbooks, presentation/video, signed contribution forms and official submission. Automated checks do not establish submission or every manual acceptance outcome. Rehearse the exact build using the [release checklist](docs/testing/Final_Release_2026-10-28.md).
