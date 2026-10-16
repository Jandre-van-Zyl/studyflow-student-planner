# Contribution and Git workflow

Main is the integration branch. Personal branches: dewald, aneesah, riaan, jandre, omphemetse. Use your own GitHub identity. Jandre owns the repository; Dewald leads; Aneesah records actual meeting decisions/actions.

## Get the shared bootstrap

After cloning, create your local tracking branch once. Example for Riaan:

```powershell
git status
git fetch origin
git switch --track origin/riaan
git merge origin/Main
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Use your own branch name. If it already exists locally, use `git switch riaan`. Commit or safely preserve unfinished changes before switching/merging. Do not overwrite an existing `.env.local`. All dependencies come from `npm ci`; see [setup](docs/development/SETUP.md) for Node 24.

## Start each later task

```powershell
git status
git fetch origin
git switch riaan
git merge origin/Main
npm ci
```

Agree task ownership and shared contract changes. Work in your feature folder. Services use `src/lib/firebase`; shared fields are in `src/shared/types/planner.ts`. Coordinate shared changes; do not duplicate SDK initialization or discard another member's work.

## Verify, commit, push and review

```powershell
npm run check
git status
git diff
git add src/features/subjects
git commit -m "feat(subjects): add subject creation form"
git push -u origin riaan
```

Use actual relevant files/message. `npm run check` covers formatting, lint, types, unit/UI tests and build. Run `npm run format` if needed. Database-rule changes also need `npm run test:rules` and relevant ownership/schema cases. Verify user flows in a browser. Report unrun checks explicitly.

Open a PR with **base Main** and **compare your branch**. Explain the concrete result, task/FR IDs, checks and limitations. Another member reviews before the agreed merge. Merge commits retain the individual commit trail. Keep the personal branch and merge updated origin/Main before starting again. The workflow is documented; required-review branch protection is not configured. CI checks Main pushes and PRs targeting Main. No force pushes, resets or rebasing shared history.

## Dependencies, data and evidence

Use npm/package-lock.json. Add dependencies only for an agreed need; commit both package files. Ordinary setup is `npm ci`, not a manual list of latest installs. Do not introduce another lockfile.

Keep `.env.local`, passwords/tokens, private/service-account keys and real participant records outside Git. Use synthetic demo data and the local emulator until shared cloud setup is agreed. Each owner supplies real code, tests, design input and a demo explanation with authentic commit/PR references. Bootstrap assistance from Jandre's account is not someone else's assessed contribution. Do not make empty commits or invent author identities/evidence.

See [DAY_ONE.md](docs/development/DAY_ONE.md) for proposed first tasks. The starter does not complete the SRS, chapters, literature review or planned acceptance tests.
