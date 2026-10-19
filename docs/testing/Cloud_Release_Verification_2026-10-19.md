# Cloud release build verification

19 October 2026; local branch jandre. Scope: explicit cloud build/preview commands and isolated Hosting output. This record does not establish a working hosted backend or deployed application.

## Problem and change

The default build could produce an application without explicit cloud configuration, and its output was also the Hosting publication directory. A later ordinary check/build could replace a previously prepared release. The new `build:cloud` command validates the selected cloud mode and required public settings before bundling into `dist-cloud`. Hosting now reads that separate directory. `preview:cloud` serves its existing bundle; it does not rebuild it. The local emulator and layout development modes remain forced.

## Executed verification

| Check                                                                                                        | Observed result                                                                                         |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| RED checkpoint `190e1ab`, focused cloud-build tests before implementation                                    | Five failures and one pass reproduced the missing safeguards.                                           |
| Focused tests after implementation and native-process fixture isolation                                      | Six tests passed.                                                                                       |
| `npm run check`                                                                                              | Passed formatting, ESLint, TypeScript, 136 app tests across 14 files, and the default production build. |
| `npm run build:cloud` without cloud settings                                                                 | Expected exit 1; configuration prevented a release.                                                     |
| Real `build:cloud` with synthetic public process configuration and an output override outside the repository | Exit 0; compilation succeeded. No cloud service was contacted or verified by this build.                |
| `git diff --check`                                                                                           | Passed before the checkpoint.                                                                           |

The six tests cover required settings, mode-specific environment precedence, isolated output, rejection of an emulator override, rejection of `demo-studyflow`, preservation of local development modes, and agreement between Hosting configuration and package commands. Vite configuration is loaded in child Node processes so Vitest's browser environment cannot replace its actual environment-loading behaviour.

Logs are retained in Jandre's private planning execution folder. They include the meaningful RED run, focused GREEN run, complete core check, missing-configuration command and synthetic compilation. Synthetic configuration is intentionally not a real issued Firebase app configuration. No personal student address appears in these fixtures.

## Limits and next verification

No Authentication service, database rules, persisted schema or interface behaviour changed in this task. Emulator rules/integration suites and browser account flows were not rerun for this build-only change. Real Firebase web settings, approved-user enforcement, deployed rules, cloud login/save/reload and public Hosting remain separate tasks. These six tests are not the 35 planned capstone acceptance cases.

No dependency, lockfile, global installation, billing configuration, remote branch or deployment was changed by this implementation. Three pre-existing documentation edits were preserved outside its commit.

Read the [cloud release workflow](../development/CLOUD_RELEASE.md) before preparing a real release. The project must remain on Spark without a linked billing account. Do not upgrade to Blaze or enable a paid service to work around a quota limit.
