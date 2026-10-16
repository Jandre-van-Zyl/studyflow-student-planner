# StudyFlow - Student Planner

Software Engineering 2 capstone, Group 1, CTU Training Solutions.

**Account/profile module, 16 October 2026.** Email/password registration, sign-in/out, protected routes, private profile storage and seven-day study-budget editing are implemented. The module includes session cleanup, profile recovery, concurrent-edit protection, schema/ownership rules and tests. Subjects, assessments, calendar logic and planning insights remain workspaces for their owners. Read the [account handoff](docs/development/ACCOUNTS_HANDOFF.md) and [verification record](docs/testing/Jandre_Accounts_Verification_2026-10-16.md). Git/PR history determines integration status; this is not cloud deployment or a completed capstone.

## Start here

Install **Node.js 24 LTS, version 24.15 or newer within 24.x**, npm 10 or 11, and Git. Tested runtime: Node 24.19.0, recorded in `.nvmrc`. Node 22 does not meet the selected Firebase SDK's dependency requirements. See [setup and troubleshooting](docs/development/SETUP.md) first if you need to update Node.

Accept your private-repository invitation, then use your **own branch**. Example for Aneesah:

```powershell
git clone https://github.com/Jandre-van-Zyl/studyflow-student-planner.git
cd studyflow-student-planner
git switch --track origin/aneesah
git merge origin/Main
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open **http://127.0.0.1:5173**. The starter works without a Firebase account. `npm ci` installs all locked project dependencies and local dev tools; no global React, Tailwind, TypeScript, Vite or Firebase install is needed.

Already cloned and have a clean working tree? Replace `aneesah` below with your branch:

```powershell
git status
git fetch origin
git switch aneesah
git merge origin/Main
npm ci
npm run dev
```

If your local branch does not exist yet, use `git switch --track origin/aneesah`. Copy `.env.example` only if `.env.local` is missing; preserve existing local values. Commit or safely preserve unfinished work before switching or merging. The owner does not automatically advance your remote personal branch.

## Working accounts and settings

Use Java 21+ and two terminals at the repo root:

```powershell
# Terminal 1: disposable local Auth and Firestore
npm run emulators
```

```powershell
# Terminal 2: forces demo mode, ignoring cloud values
npm run dev:emulator
```

Open http://127.0.0.1:5173/account and register a synthetic test account. Settings saves the display name and all seven daily study budgets. Defaults are zero; choose your own budgets. Sessions survive refresh in the same tab. Sign out when finished. Local accounts/data disappear when the emulators stop.

Ordinary `npm run dev` respects `.env.local` and still defaults to a layout preview without accounts. No Firebase cloud account is needed for local work. Read [Firebase setup](docs/development/FIREBASE.md).

## Team and proposed work

| Member                | GitHub           | Branch       | Proposed module                                   |
| --------------------- | ---------------- | ------------ | ------------------------------------------------- |
| Dewald Van Jaarsveldt | Dewald-vJ        | `dewald`     | Assessments; confirmed team lead                  |
| Aneesah Rehman        | charming-leather | `aneesah`    | Dashboard/advice/workload; confirmed minute-taker |
| Riaan Jacobs          | helios5455-cmd   | `riaan`      | Subjects and weekly classes                       |
| Jandre Van Zyl        | Jandre-van-Zyl   | `jandre`     | Accounts, Firebase/security and shared foundation |
| Omphemetse Dikeledi   | Theoblac         | `omphemetse` | Weekly planner and study blocks                   |

Technical assignments remain proposals. **Main** has a capital M. Each member merges `origin/Main` into their own branch, builds there, then opens a PR back into Main for another member's review. This is the documented workflow; server-enforced branch protection is not configured. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Stack and structure

One root frontend: **React + TypeScript + Tailwind CSS + Vite**, React Router for navigation, and Firebase's modular web SDK for later Auth/Firestore features. No separate API server, Docker or database server is needed for the UI.

```text
src/
  app/                  Routes and bootstrap UI tests
  features/
    auth/               Account/authentication work
    subjects/           Subjects and recurring classes
    assessments/        Assessment CRUD, status and filters
    planner/            Week view, study blocks and clashes
    dashboard/          Priority, workload and overview
    settings/           Profile and daily study budgets
  shared/
    components/         Shared layout and UI
    types/              Persisted document contracts
  lib/firebase/         Lazy client and explicit mode/config
  test/                 Browser-test setup
firebase/               Local rules, indexes and rule tests
docs/development/       Setup, architecture, Firebase and day-one tasks
docs/planning/          Detailed proposed plan, requirements and backlog
docs/proposal/          Prepared Week 1 PDF
.github/                CI and pull-request template
```

[Architecture](docs/development/ARCHITECTURE.md) defines module boundaries. [Tomorrow's start plan](docs/development/DAY_ONE.md) gives a small first deliverable per module.

## Commands

| Command                             | Purpose                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `npm ci`                            | Install exact versions from package-lock.json                                   |
| `npm run dev`                       | Frontend on port 5173; respects configured mode                                 |
| `npm run dev:emulator`              | Working accounts/settings using the local Auth/Firestore backend                |
| `npm run check`                     | Format check, lint, types, unit/UI tests and production build                   |
| `npm test` / `npm run test:watch`   | Run/watch bootstrap and later feature tests                                     |
| `npm run format`                    | Format maintained source/config/docs                                            |
| `npm run build` / `npm run preview` | Build dist / preview on port 4173                                               |
| `npm run emulators`                 | Optional local Auth/Firestore; Java 21+ required                                |
| `npm run test:rules`                | Firestore profile ownership/schema and retained feature guards; Java 21+        |
| `npm run test:integration`          | Real local Auth/profile flows, isolation, revisions and offline saves; Java 21+ |

Core checks are also configured for GitHub Actions on Main pushes and PRs targeting Main. Configuration is separate from an actual hosted passing run. Starter tests do not complete the 35 planned capstone acceptance cases.

The production dependency audit is clear at this baseline; the optional Firebase CLI has known development-only audit findings. See [dependency notes](docs/development/DEPENDENCIES.md) for the exact scope and follow-up.

## Firebase and status

Read [FIREBASE.md](docs/development/FIREBASE.md). Default `disabled` mode needs no credentials. `emulator` forces local demo-studyflow and ignores cloud values. `cloud` requires explicit complete public web configuration. No cloud project, billing account or deployment was created.

Firestore rules permit only valid own-profile create/get/update at `users/{uid}`. Profile listing/deletion and unfinished feature collections remain denied. Each feature owner adds schema/ownership rules and tests before persistent CRUD. `.env.local` stays outside Git; never put passwords, service-account JSON or private keys in the frontend.

## Account/profile engineering evidence

- [Account architecture, sequence and data dictionary](docs/design/Accounts_and_Profile_Design.md)
- [Shared API and developer handoff](docs/development/ACCOUNTS_HANDOFF.md)
- [Executed tests and browser checks](docs/testing/Jandre_Accounts_Verification_2026-10-16.md)

## Project documents and checkpoints

- [Week 1 proposal](docs/proposal/Group1_Week1.pdf): drafted; submission/approval not verified here.
- [Full proposed plan](docs/planning/Student_Planner_Full_Project_Plan.md)
- [Requirements and planned tests](docs/planning/Student_Planner_Requirements_and_Tests.md)
- [Proposed delivery backlog](docs/planning/Student_Planner_Delivery_Backlog.md)

The three plans preserve the 15 October proposed baseline; README/development notes describe the actual 16 October starter. The five students are the client. Actual requirements evidence, final technical assignments, proposal approval and Firestore assessment fit still need recording.

| Date, Africa/Johannesburg            | Checkpoint                                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Fri 16 Oct, before morning practical | One-page proposal, once per group by Dewald via Teams to Jabulile Mashibini                               |
| Mon 19 Oct, 12:00                    | Separate Week 2 and Week 3 PDFs together; research, SRS/design and each member's meaningful early commits |
| Fri 23 Oct, 12:00                    | Working Must scope, database, walkthrough, dissertation draft and actual test/evaluation evidence         |
| Thu 29 Oct                           | Final dissertation/source/evidence and live demo; exact cutoff/presentation details still to confirm      |

Put the repo URL on page 1 from Week 2 onward and arrange accepted assessor access to the private repo. Each member needs genuine feature/test contributions; assistant-assisted setup is not five members' coding evidence.
