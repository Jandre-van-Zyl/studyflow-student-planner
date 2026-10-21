# CTU connection prototype verification

21 October 2026. Local optional branch `prototype/ctu-sync-20261021` based on Main `946018d`. Real-account access was explicitly authorized by the account owner, who entered their own password and installed/reloaded the helper manually. No raw account dump, grades, credentials, private files or real-account screenshots are included in the repository.

## Implemented and tested boundary

See [the developer/run guide](../development/CTU_PREVIEW_PROTOTYPE.md) and canonical [shared contract](../../src/features/ctu/portalContract.ts). The same DOM reader is used in synthetic fixtures and the packaged helper. New meaningful cases cover exact source origin/path, allowed fields, timed/date-only deadlines, duplicate module suffixes, conflicting dates, partial pages, bounds/unknown fields, unsafe links, wrong origins/nonces, admitted-account gating, cancellation, late replies and account changes.

Worker tests simulate the actual Chrome API boundary; they are not represented as a real-browser test. They cover automatic five-page orchestration, owned-tab cleanup, rejected senders, cancellation, partial failure, transient blank tab URLs, missing optional app-tab URL metadata and the page-world activation needed by CTU's JavaScript course links.

## Real browser observations

- Existing approved StudyFlow cloud sign-in and verified CTU session were used. StudyFlow displayed the account owner's supplied email; the helper never received their password or Firebase credentials.
- User installed the reviewed local helper in Opera. Automation was explicitly blocked from the internal extension settings URL; no workaround was attempted. User manually reloaded helper versions after fixes.
- Initial 0.1.0 failed on a transient uncommitted tab URL. Regression reproduced RED, then fixed by bounded waiting before exact permitted-page injection.
- Version 0.1.1 then failed because optional app-tab URL metadata was omitted without broader permissions. Regression reproduced RED, then fixed using the already browser-validated content-script sender plus app/bridge reply guards. No broader permission was added.
- Version 0.1.2 collected five assessments, five notice/schedule links and eight distinct resource titles. Four deadlines included 23:30; one remained date-only. Uploaded indicators were separate from completion. The module table was honestly reported incomplete.
- Course details require the JavaScript link to execute in the page's MAIN world. The failing zero-module case was added to the worker simulation and fixed without reading page globals or grades. Only this known UI activation runs in MAIN; the capture remains isolated.
- Helper 0.1.3 successfully collected eight modules, five assessments, five notice/schedule PDF links and eight distinct resource titles in the actual Opera/CTU/StudyFlow workflow. All five page categories were read; the incomplete-module warning disappeared. The result was visible at 13:02 SAST. These counts describe the inspected pages, not all possible academic information.
- Repeating the full collection produced identical assessment rows and unchanged counts, with no UI alerts or captured browser errors. Each attempt replaces the in-memory preview; no duplicate records were appended or persisted. The existing user CTU tab remained open.

## Verification status and limits

The full application suite has 206 tests, including 19 new prototype cases. Formatting, TypeScript, production build and strict helper compilation/build are included in final verification. ESLint retains the one inherited AuthProvider warning; no new warning/error is accepted. Coverage percentage is unmeasured. See the retained final command log for the exact run result.

Firestore schemas, rules and services are unchanged, so rule/integration suites were not rerun for this preview-only increment. Their earlier Main results remain historical rather than new prototype test counts. Coverage percentage is unmeasured.

No business-record save/import function exists in this prototype. Its checkbox acknowledges only the displayed account name against StudyFlow email; it is not verified email binding or a stored connection. Portal data stays in component/request memory and disappears on clear/navigation/sign-out/reload. Timetable/calendar PDFs remain links, source timezone remains unconfirmed, no class slots or effort estimates are invented, and no unattended/browser-closed sync is claimed. No GitHub push, Main merge, Hosting deployment, Firebase configuration/access change or academic submission occurred.
