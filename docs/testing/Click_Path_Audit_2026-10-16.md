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
