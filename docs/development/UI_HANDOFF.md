# UI and motion handoff

**Later update, 16 October:** the visual/motion guidance below remains current, but its preview-only data section is the earlier UI checkpoint. Signed-in planner persistence is now implemented; use the [current planner handoff](PLANNER_HANDOFF.md) and [contract](../design/Planner_Data_Contract.md) for storage, loading/recovery and rules. Disabled mode alone retains the session preview. The original verification remains dated evidence of the UI-only baseline.

Implemented locally on jandre, 16 October 2026, following Jandre's direct instruction to implement the earlier guide. This supersedes the guide-only boundary. No packages, Firebase schemas/rules or cloud settings changed.

## What works

- All six routes use warm paper, existing navy/teal, Georgia titles, Segoe UI controls, flat navigation and purpose-specific layouts. No external fonts/images or motion library.
- Desktop sidebar; tablet/mobile native modal navigation with explicit Tab looping, Escape, scroll lock and focus restoration. Routes move focus to main content; private views disappear immediately on sign-out or UID change.
- Subjects/classes: validated forms, unique subject codes, recurring dates and archive/restore.
- Assessments: responsive semantic table/mobile list, search/subject/status filters, active/completed/archive views, editor, completion/reopening and retained history.
- Planner: Monday–Sunday, previous/today/next week, mobile selected day including weekends, chronological classes/study/deadlines, 15–180 minute editor, explicit named overlap confirmation, future-Done rejection and cancellation history.
- Dashboard: selected-day agenda, published urgency/priority ordering with explanation, real preview-data completion and study-only allocation. Saved profile budgets feed it when signed in.
- Existing Firebase account/profile saves and recovery are retained. A confirmed profile save moves focus to the success message. All seven budgets remain integer 0–1440; failed/concurrent edits retain inputs.

## Data boundary

The four planner modules use **in-memory session preview state** in [PlanningWorkspace](../../src/features/planner/PlanningWorkspace.tsx). They start empty. Load example week explicitly loads synthetic 19–25 October 2026 records; Clear preview asks for confirmation. Refresh/sign-out/UID switch clears planner records. Ordinary route/account navigation retains them. No browser storage, network save, collection access or false persisted-success message is used for these records. Account/settings pages have no preview notice because they use the existing Firebase implementation.

[planningView](../../src/features/planner/planningView.ts) defines UI adapters using SAST date strings, distinct from [persisted Timestamp contracts](../../src/shared/types/planner.ts). Preview assessments omit completedAt. Future services must preserve actual timestamps/completedAt and add owner/reference/schema validation; do not persist adapters blindly. Rules still deny every unfinished collection.

Provider state is scoped by the authenticated shell identity/status. Feature views remain behind AuthGate. Future listeners must require ready status/current UID and detach on cleanup; never initialize another Firebase app or hold private records in module globals. Add loaded/empty/error/partial/permission states and show saved success only after server acknowledgement. Preview editing is not evidence that FR-03 through FR-12 pass persistent acceptance tests.

## Shared UI contract

[styles.css](../../src/styles.css) contains the palette, system fonts, spacing recipes, controls, feedback and motion. [FormField](../../src/shared/components/FormField.tsx), [SelectField](../../src/shared/components/SelectField.tsx), [Modal](../../src/shared/components/Modal.tsx) and [PlanningUI](../../src/shared/components/PlanningUI.tsx) are the reusable components. Native controls provide their own popup behaviour.

Motion uses 100ms hover/feedback, 140ms small panels and newly inserted preview records, 180ms incoming pages/data fills and 220ms drawer entry, with cubic-bezier(0.2,0,0,1). Removals, values, selection, focus, close, sorting and auth clearing are instant. No outgoing clones, staggering, count-up, idle loops or animation-dependent API/focus actions. The optional delayed spinner was not needed; pending text is immediate. A native reduced-motion media rule disables animations/transitions and leaves final content visible, including when the preference changes.

Run npm run check. Auth/profile service changes also require npm run test:integration; rule changes require npm run test:rules. For layout preview use npm run dev:preview and Load example week. For the actual local application use npm run dev; it starts the backend and opens login/sign-up. Advanced separate-terminal commands remain available. Keep preview state/services distinct and coordinate shared-rule changes.

See [executed verification and limitations](../testing/UI_Verification_2026-10-16.md) and [design contract](../design/UI_Implementation.md). Technical member ownership remains proposed; this assistant-assisted UI work is not teammates' contribution evidence.
