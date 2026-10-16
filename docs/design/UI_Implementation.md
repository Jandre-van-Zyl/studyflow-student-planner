# UI implementation contract

16 October 2026. Jandre directly requested implementation of the previously prepared UI and motion plans. This supersedes the earlier guide-only boundary. Work remains local on jandre.

Source: Desktop capstone planning/project/UI_Design_Guide.md v0.2. Product job: a student sees upcoming work, decides what to study and gives it time. Primary actions are Add subject, Add assessment and Add study block on their respective screens. The dashboard leads with the day's agenda and a real deadline from the current preview dataset.

Use warm paper, navy ink, restrained teal, Georgia page titles and Segoe UI body/controls. Flat 224px desktop navigation, divided lists/table and an asymmetric agenda layout replace generic promotional cards. Mobile uses a modal menu and a selected-day planner. Retain the supplied wordmark/icon style; no imagery or external fonts are needed.

The existing accounts/profile Firebase implementation is authoritative. Unfinished subject/assessment/block storage is not implemented by a UI task: build a clearly labelled, in-memory interactive preview, empty initially, with an explicit example-week action. Preview records disappear on refresh/sign-out/account switch. Do not write denied collections or present example records as a student's saved data. Shared document contracts remain unchanged for future services.

Checkpoints: shared tokens/shell/account/settings; interactive subject/assessment/planner/dashboard views; behavioural regression checks; actual browser review and evidence. Target viewports: 360x800, 768x1024, 1366x900, plus 320px reflow and 200% zoom checks.

Motion: CSS only; 100ms feedback, 140ms panels, 180ms incoming content/data fills, 220ms drawer. Focus, values, route cleanup and removals are instant. No outgoing private clones, timer-dependent actions or new libraries. Live prefers-reduced-motion disables nonessential movement.

Verification will cover keyboard/modal focus, validation, empty/no-results/populated views, archive/restore, SAST boundaries, overlap confirmation, budget/completion calculations, account error/recovery and instant sign-out isolation. Results are recorded only after execution in docs/testing/UI_Verification_2026-10-16.md.
