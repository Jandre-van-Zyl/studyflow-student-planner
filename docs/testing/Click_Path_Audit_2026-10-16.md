# Click-path audit

16 October 2026. Baseline 992ca7b, clean jandre. Jandre explicitly requested click-path-audit, then contract-first/security-review for persistent planner data. Audit precedes new persistence code. Findings/results are appended after review; this initial map is source inspection, not a passing browser audit.

## Shared state map (completed before page audits)

- AuthProvider/register: validates/stashes registration name/email, calls Firebase registration; clears registration stash on failure. Auth observer clears the previous profile listener, increments generation and loads the current UID's profile.
- AuthProvider/loadProfile: detaches prior profile listener, increments generation, sets profile-loading with user and null profile; one guarded profile listener/creation path. Failure detaches and enters profile-error with null profile. Ready snapshots replace profile. It does not own planner records.
- AuthProvider/signOut: immediately clears current UID/profile/setup/registration, increments generation and detaches profile before awaiting Firebase. Failure remains locked; retry supported. These resets are intentional privacy boundaries.
- AppShell: menuAt controls modal visibility only for its opening route key; links clear it, desktop resize clears it. Outlet wrapper keys by user UID or status, dropping prior account state when identity clears/changes. Route changes focus main and reset scroll.
- AuthGate: ready owner or explicit disabled preview only. Loading hides private feature pages; other statuses redirect to account. UID-keyed outlet unmounts feature local forms.
- PlanningWorkspace: data is four in-memory collections; setData replaces/updates them without side effects on day/budgets. setDay changes selected date/week. Example load replaces all four datasets, sets example=true and day=19 Oct. Confirmed clear resets data/example/day/clearing; keep/close resets clearing only. Provider survives ordinary route navigation; it is outside AuthGate and must not start future private listeners unless auth is ready.
- Preview budgets: derived from current saved profile when present, otherwise zero or example Monday=60. No copied stale profile budget state.
- Settings/ProfileForm: base/name/budgets/fields/error/saved/busy local to UID. loadLatest deliberately resets draft/errors/base to current profile; only explicit Discard/Reload invokes it. Submit validates, locks, saves against expected revision, applies only while mounted and reports server confirmation. Remote changes preserve draft and block save.
- Feature editor/filter state is page-local; route change unmounts it. No shared setter should reset another page's active editor/filter. Preview save currently means only a synchronous setData; persistent saves must replace that boundary with awaited acknowledgement, draft retention, UID guards and explicit loading/error states.

Dangerous reset boundaries to verify: example/clear must never touch persistent data; UID/logout/profile failure must never expose an old dataset; route navigation must not discard stored planner data; a late save/listener must not restore private data after sign-out; confirmed overlapping block must be revalidated at the write boundary.

## Findings and resolution

The state map above describes the inspected 992ca7b baseline. After mapping it, three read-only page audits covered subjects/classes, assessments and planner/dashboard. A second read-only review inspected their new asynchronous persistence boundary. These reviews did not edit code, run browser actions or represent teammates' contributions.

| Finding / sequence                                                                                   | Resolution and evidence                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archived tab → Add subject → Save hides the new active subject                                       | Switch to Active only after acknowledged new creation; executed UI regression and real browser flow pass.                                                                     |
| Edit effort → Completed → In Progress silently resets the estimate                                   | Controlled remaining draft survives toggles; app regression and browser 120-minute flow pass.                                                                                 |
| All subjects archived → dashboard Plan study time → disabled planner action                          | CTA checks actual plannable eligibility and offers Restore a subject; app regression passes. History remains.                                                                 |
| Linked assessment completes/archives but retained block omits its state                              | Shared block detail labels completion/archive in agenda and cancelled history; calculation tests and browser evidence pass.                                                   |
| Class and study share a document ID                                                                  | Self-exclusion checks kind plus ID; action lookup only resolves Study rows; warning keys include kind. Regression covers same-ID class conflict.                              |
| Committed subject creation → listener adds it → confirmation lost → retry sees own code as duplicate | Duplicate check excludes the editor's stable ID; mocked listener-before-rejection regression and real service idempotence pass.                                               |
| Listener fails → late callback revives old view                                                      | Failure stops listeners and invalidates load generation; late callback regression passes.                                                                                     |
| Same-owner listener fails while editing → draft unmounted                                            | Keep hidden/inert same-UID view/draft, suspend dialog and resume only after explicit retry/server load. Real UID/status changes still immediately unmount. Regression passes. |

## Persistent save click paths

- All create/edit/archive/restore/cancel actions use the shared awaited mutation boundary. A ref lock prevents duplicate requests; disabled controls and busy dialog Close/Escape wait for completion. Failed writes retain input/error; success closes only after service confirmation. Stable IDs originate at editor opening, not each submit.
- Opening an editor captures its revision. Listener changes do not silently update that revision into the old draft. Conflicts explain that closing/reopening explicitly loads the latest record. Account/route unmounts ignore late completion.
- Initial loading and errors are distinct from empty; Retry reinstalls listeners. Same-owner failed loading hides/inerts the retained page while preserving drafts. Auth status/UID change disposes the whole old workspace. Example/Clear preview remain unavailable in signed-in mode.
- Block overlap submission checks current intervals; input changes reset pending confirmation, and changed observed conflicts require renewed confirmation. Future Done is checked again on confirmation and by service/rules. This is advisory, not a distributed collision lock.
- New references require active own parents; existing archived/completed references remain selectable for retained history. Completing/archiving an assessment never deletes its blocks. Cancelled blocks retain history but leave allocation.

Source tracing covered Add/Edit/Save/Cancel/Close/Escape, archive/restore, active/completed/archive views, search/filters/clear, day/week controls, named overlap/Change time/confirm, Done/cancel/history and dashboard navigation. No further actionable high-impact defect was identified in the second source review; this is bounded review evidence, not proof that every possible browser/session sequence is defect-free.

See the [executed verification/security report](Planner_Persistence_Verification_2026-10-16.md) for final automated counts, actual browser journeys, compiled smoke test, evidence and remaining limits.
