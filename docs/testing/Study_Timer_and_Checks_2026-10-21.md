# Study timer and assignment checks — 21 October 2026

Study timer is available at the bottom-right of the private/labelled-preview workspace. Session length is 1–180 whole minutes, default 25. Start, Pause, Reset and Minimise controls; countdown is based on a deadline timestamp rather than subtracting interval ticks. It remains mounted across menu navigation and resets on reload or account change. It records no actual study time and does not alter budgets, assignments, planned blocks or progress.

Pop out requests Document Picture-in-Picture where available, otherwise opens a separate 360px browser window. The same React controls/state render in the child window. Closing it returns controls to the app; sign-out/account change/unmount closes it. Popup blockers produce an actionable error and retain the inline timer. Regular popup opener is detached. The browser controls always-on-top availability: a normal popup cannot be guaranteed above other applications. Keep the StudyFlow tab open. No new permissions, extension capability, dependency or backend schema.

Primary browser API reference: https://developer.chrome.com/docs/web-platform/document-picture-in-picture/. Runtime feature detection, not a browser-name guess, selects the path. Chrome/Edge/PiP compatibility remains to be tested on actual supported browsers.

Green circled checks show Uploaded to CTU when an Assignment/FA source reports an uploaded file; Completed by you when the personal assignment is completed. Native completed assessment rows also use green checks on desktop/mobile. Source upload and personal completion remain separate states; sync does not silently complete a task. Text labels accompany colour/icons. Actual existing saved data showed both labels, without this task modifying an assignment.

Browser verification: Opera timer started at25:00, opened a separate window, continued after navigating Dashboard→Assessments, paused at24:31 and displayed the normal-window limitation. Opera did not expose documentPictureInPicture. Green check text rendered at rgb(23,97,59). No always-on-top or other-application visual test is claimed. Document-PiP branch has a mocked behavioural test, not a browser certification.

Verification commands/results: npm run check (format, lint, TypeScript, app tests, default build), npm run build:cloud and git diff --check. Existing AuthProvider ref-cleanup lint warning remains. Final exact test count is recorded in the task's StudyFlow_Timer_Check_2026-10-21.log. Tests cover start/pause/reset, wall-clock catch-up, invalid lengths, blocked popup, and PiP choice/unmount closure. No Firebase deployment, Hosting, GitHub push, native install or real planner write.

Final result: full check passed248tests/31files, zero lint errors and one inherited warning; both production builds and diff check passed. Browser test timer reset and returned inline afterward. No real assignment changed by this task.
