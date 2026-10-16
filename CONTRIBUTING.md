# Contribution and Git workflow

The default integration branch is `Main`. Personal branches are `dewald`, `aneesah`, `riaan`, `jandre` and `omphemetse`. Everyone uses their own GitHub identity. The repository owner is Jandre; the team lead is Dewald; Aneesah records actual meeting decisions/actions.

## Before a task

Agree the task owner and scope. Check that no one else is changing the same shared contracts. Keep unrelated work out of the change. Choose the correct personal branch and inspect local changes before switching or merging.

Example for Riaan, after the initial clone:

```powershell
git status
git fetch origin
git switch riaan
git merge origin/Main
```

If your local personal branch does not exist yet, use `git switch --track origin/riaan` instead. Resolve genuine conflicts carefully; never overwrite another member's work or force-push shared history.

## Commit, push and review

Make a focused change. Inspect the diff, run the checks relevant to that change, and commit only the intended files. Example paths below are for a documentation task already present in this repository:

```powershell
git diff
git add README.md CONTRIBUTING.md
git commit -m "docs: clarify the team contribution workflow"
git push -u origin riaan
```

Replace the example branch/files/message with your actual work; do not make empty commits just to appear in the history. For application changes, use the agreed formatter, lint, type check, tests and build once those tools exist. Record exact checks and actual results; do not call unrun checks passed.

Open a pull request with base `Main` and compare your personal branch. Explain the problem, resulting behaviour, relevant FR/NFR/task IDs, checks and limitations. Another member reviews the diff before the agreed merge. Merge commits retain the individual commit trail; agree a different merge strategy explicitly if needed. Keep the long-lived personal branch and merge updated `origin/Main` before beginning the next task.

This is the documented team workflow. It is not a claim that server-enforced branch protection or required approvals have been configured.

## Evidence

Every owner supplies real module code, tests where relevant, requirements/design input and a presentation explanation. Link commits/PRs and actual test results to the supplied contribution, test, defect and traceability records. Repository bootstrap performed from Jandre's account is not the other members' contribution evidence. Do not use another person's name/email to manufacture authorship.

## Secrets and data

Do not commit account passwords, tokens, service-account/private keys, real participant records or environment values. Use synthetic demo data. Local environment files, generated build output and Firebase emulator caches are ignored. Only a reviewed `.env.example` may be added later, containing public configuration names and safe examples.
