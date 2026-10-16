# Team setup - Windows / PowerShell

Baseline: 16 October 2026. One root project, local dependencies, npm throughout.

## 1. Prerequisites

```powershell
git --version
node --version
npm --version
```

Use **Node 24 LTS, at least 24.15.0 and below 25**, with npm 10 or 11. Tested Node: 24.19.0, recorded in `.nvmrc`. The selected Firebase SDK requires Node 24, so Node 22 will fail the engine check. Install Node 24 LTS from [the official download page](https://nodejs.org/en/download), reopen the terminal, and verify the version. Windows users choosing the official winget package can run:

```powershell
winget install --id OpenJS.NodeJS.LTS --exact --source winget
```

Only do this if Node 24 LTS is missing. If using nvm/fnm, select `.nvmrc` with that manager instead. The version file does not install Node automatically. Java is optional for the frontend; **Java 21+** is needed only for Firestore emulator/rule tests.

## 2. First clone

Accept your invitation as the correct GitHub account:

```powershell
git clone https://github.com/Jandre-van-Zyl/studyflow-student-planner.git
cd studyflow-student-planner
git fetch origin
```

Choose the command for your member branch:

| Member     | First local branch command             |
| ---------- | -------------------------------------- |
| Dewald     | `git switch --track origin/dewald`     |
| Aneesah    | `git switch --track origin/aneesah`    |
| Riaan      | `git switch --track origin/riaan`      |
| Jandre     | `git switch --track origin/jandre`     |
| Omphemetse | `git switch --track origin/omphemetse` |

Then on your personal branch:

```powershell
git merge origin/Main
npm ci
Copy-Item .env.example .env.local
npm run dev
```

The command starts local Auth/Firestore and opens http://127.0.0.1:5173/account for login/sign-up. Java 21+ is required; use a disposable test account. Ctrl+C stops the frontend and emulators together. No Firebase cloud account is needed. For layout-only work without Java, use `npm run dev:preview`. `npm ci` installs all locked packages; do not run `npm create vite` or create a nested project.

## 3. Already cloned

```powershell
git status
git fetch origin
git switch riaan
git merge origin/Main
npm ci
npm run dev
```

Replace riaan with your branch; use the tracking command if it does not exist locally. Copy environment defaults only when missing:

```powershell
if (-not (Test-Path -LiteralPath '.env.local')) {
  Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
}
```

Preserve unfinished changes before switching/merging. Do not reset your branch to Main. Merging origin/Main brings in the shared baseline and retains your history; the owner does not automatically move your remote personal branch.

## 4. Verify your work

```powershell
npm run check
```

This checks formatting, ESLint, strict TypeScript, unit/UI tests and production build. `npm run format` fixes formatting. Build output dist is ignored. A local build is not deployment or completed capstone acceptance.

## 5. Local backend development

Read [FIREBASE.md](FIREBASE.md). `npm run dev` manages the backend and frontend in one terminal; do not start a separate emulator alongside it. An advanced two-terminal workflow remains `npm run emulators` plus `npm run dev:emulator`. Both force demo-studyflow without env edits. Register a synthetic account and exercise private planner/profile saves. No cloud account or global CLI is required. See the [planner handoff](PLANNER_HANDOFF.md).

## Troubleshooting

| Symptom                                  | Action                                                                                                                                                                |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm.ps1 blocked in PowerShell            | Use `npm.cmd ci`, `npm.cmd run dev`, etc.; do not change machine-wide execution policy.                                                                               |
| EBADENGINE                               | Select Node 24.15+ within 24.x and reopen the terminal. `Get-Command node` shows which runtime is selected.                                                           |
| Repository not found / permission denied | Sign in as the invited account and accept the private-repo invitation.                                                                                                |
| No package.json                          | Merge origin/Main and run commands at the repository root.                                                                                                            |
| Lockfile mismatch                        | Pull the paired package.json/package-lock.json change; do not delete the lockfile or use force flags.                                                                 |
| Port 5173 occupied                       | Stop the existing StudyFlow server before npm run dev; it deliberately keeps a fixed port. For an advanced separate backend, use npm run dev:emulator -- --port 5174. |
| Firebase unavailable                     | npm run dev starts the backend automatically; check Java 21+ and occupied emulator ports. Use npm run dev:preview for layout-only work.                               |
| Firestore permission denied              | Check the current authenticated UID, profile and planner schema/reference constraints; do not relax the owner rules.                                                  |
| Hosted deep link fails later             | The future SPA rewrite is in firebase.json; actual deployment is separately authorized.                                                                               |

Primary references: [Vite](https://vite.dev/guide/), [Tailwind](https://tailwindcss.com/docs/installation/using-vite), [React Router](https://reactrouter.com/start/declarative/installation), [Firebase web](https://firebase.google.com/docs/web/setup), [emulators](https://firebase.google.com/docs/emulator-suite/install_and_configure), [Vitest](https://vitest.dev/guide/). The lockfile, rather than a changing latest-install list, defines the team's package versions.
