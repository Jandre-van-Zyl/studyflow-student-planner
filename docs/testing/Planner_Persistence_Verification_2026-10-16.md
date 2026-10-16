# Planner persistence verification and security review

16 October 2026, Africa/Johannesburg. Local jandre work following the requested ECC click-path-audit → contract-first → security-review sequence. Baseline was clean 992ca7b. No push, PR, Main/team-branch merge, cloud access/deployment or course submission. The report describes executed local checks, not production certification or all capstone acceptance cases.

## Result

**Implemented and locally verified:** private subject/class/assessment/block saves and listeners, live dashboard data, exact runtime/storage schemas, SAST adapters, stable create retries, captured-revision conflicts, server timestamps, archive/cancel history and failed-draft recovery. Existing profile/account safeguards, minimal dependency set, visual design and CSS motion remain. The [v1 contract](../design/Planner_Data_Contract.md) and [handoff](../development/PLANNER_HANDOFF.md) describe the observable boundary.

| Command/check                 | Executed result                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`               | PASS: Prettier, ESLint, TypeScript, **130 app tests / 13 files**, production Vite build                                                                                         |
| `npm run test:rules`          | PASS: **93 rules tests**, disposable Firestore emulator                                                                                                                         |
| `npm run test:integration`    | PASS: **9 integration tests**, actual Auth/Firestore SDK/services in disposable emulators                                                                                       |
| Total automated cases         | **232 passed**, zero failed at final gates                                                                                                                                      |
| `npm audit --omit=dev --json` | PASS: zero production dependency advisories on this run; no packages changed                                                                                                    |
| Source/diff scan              | No console logging, browser-storage planner copies, innerHTML injection or private-key patterns found in the scanned source/backend/workflow files; only `.env.example` tracked |
| Browser                       | PASS for the specific journeys below; no captured console errors in checked dev/compiled tabs                                                                                   |

All 109 relative links across 28 repository Markdown files resolved; all seven copied screenshots matched their source SHA-256 hashes. The complete frontend gate also passed after crash recovery, restoring the normal production build.

Percentage coverage was not measured; no coverage plugin/dependency was added. Existing development-tool advisories are outside the production-only audit result. This is an evidence-based local review, not a penetration test or blanket security guarantee.

## Test-first evidence

- **342d9ad:** executed RED for three UI defects (Archived creation visibility, effort-toggle draft loss, unusable dashboard planning CTA). Valid linked owner creation was denied by the then-closed feature rules. Storage-contract tests referenced the intentionally missing adapter module; they were not claimed as executed runtime cases at that stage.
- **ebe23a1:** added emulator provider journeys before plannerService existed; the missing provider was the explicit RED boundary, not a passing integration result.
- **3ffea83:** executed RED showed a late callback reviving data after a listener failure; four other focused lifecycle cases passed.
- **4242f0f:** executed RED for uncertain subject-create retry and same-owner connection draft loss; five earlier lifecycle cases passed.
- Final GREEN gates above run the complete implementation and regression suites. These local checkpoints remain in history; no rewriting/squashing occurred.

## Security boundary reviewed

| Concern                   | Enforcement and evidence                                                                                                                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication/ownership  | Services compare current Auth UID; rules require owner UID plus existing profile. Foreign/unauthenticated get/list/write tests deny access. No collection-group queries or editable owner fields.                                             |
| Schemas and validation    | Exact keys, text limits, enums, booleans/integers, minute-aligned timestamps, real class dates including leap days, ordered active ranges, 15–180 minute same-SAST-day blocks. Client runtime validation and independent Firestore rules.     |
| Parent references         | New/changed refs require own active subject/incomplete active assessment; unchanged archived/completed refs remain editable for history. Missing/foreign references denied.                                                                   |
| Subject-code races        | Atomic subject/subjectCodes claim writes, owner-only claim get, denied lists/claim stealing and tested rename/reuse. Concurrent integration attempts yield one winner.                                                                        |
| Metadata/completion       | Server createdAt/updatedAt, immutable createdAt; completion time set on transition and retained on Completed edits; reopening clears time and requires positive effort. Actual backend assertions cover both.                                 |
| Conflicts/retries/offline | Server preflight, transaction revision comparison and stable-ID identical creation retry; offline edits fail without a later queued surprise write. Lost acknowledgement retains the draft; changed existing records require explicit reopen. |
| UI lifetime               | Duplicate-operation ref lock, busy controls/dialog close, page unmount and UID/status isolation. Same-owner read errors hide/inert records and suspend dialogs without discarding drafts; retry generation rejects stale saves/callbacks.     |
| History                   | Feature hard deletes denied; archive/cancel only. Assessment completion/archive retains blocks and labels linked state in active/cancelled history.                                                                                           |
| Preview isolation         | Synthetic sample/clear controls exist only in disabled mode. Ready accounts observe actual collections; no sample import or false persisted-success copy.                                                                                     |
| Secrets and SDK           | Existing Firebase singleton/session persistence and ignored local configuration preserved. No Admin SDK/private credentials, external service, package, global setting or hook trust change.                                                  |

Firebase's [transaction documentation](https://firebase.google.com/docs/firestore/manage-data/transactions) and [atomic rule validation guidance](https://firebase.google.com/docs/firestore/security/rules-conditions) informed the claims/reference checks. [Listener metadata guidance](https://firebase.google.com/docs/firestore/query-data/listen) supports separating cached/pending snapshots from server-confirmed data. The emulator tests, rather than these links alone, establish the implemented behaviour.

## Browser evidence

All records/accounts in screenshots are synthetic and existed only in the local demo-studyflow emulator. Desktop viewport 1366×900; mobile 360×800. Observed scroll widths were 1351 and 345 respectively, with no horizontal overflow. The viewport override was reset and the temporary compiled tab closed.

1. Register local test account; signed-in Subjects starts empty without example controls. Add subject from Archived; acknowledged create switches to Active. Add recurring class; refresh retains subject/class.
2. Add assessment with SAST deadline and 120 minutes; toggle Completed → In Progress before save and retain 120. Save and navigate to planner.
3. Add 09:30–10:15 block over a 09:00–10:00 class; warning names the class, requires explicit confirmation. Dashboard after refresh shows both records, 45 minutes reserved and unchanged assessment estimate.
4. Complete assessment; scheduled block remains labelled Assessment completed, progress becomes 1/1 and remaining work becomes zero. Edit retained block on mobile; future Done is rejected with draft intact. Cancel saves and retains labelled history while allocation becomes zero.
5. Sign out, register a second local account; its Subjects page is empty and contains none of the first account's records. Actual SDK tests separately reject direct foreign access.
6. Compile with `vite build --mode emulator`, serve with `npm run preview` on 4173, register another synthetic account, save subject BUILD, refresh and observe it reloaded. No captured error logs; Firebase chunk execution ordering remains intact.

Screenshots:

- [Dashboard after saved-data refresh](../evidence/planner/dashboard-saved-after-refresh.png)
- [Completed assessment retains its block](../evidence/planner/completed-assessment-retained-block.png)
- [Mobile saved dashboard](../evidence/planner/mobile-saved-dashboard.png)
- [Future-Done validation retains draft](../evidence/planner/mobile-future-done-retains-draft.png)
- [Cancelled history labels](../evidence/planner/mobile-cancelled-history.png)
- [Second account starts empty](../evidence/planner/second-account-empty.png)
- [Compiled save survives refresh](../evidence/planner/compiled-save-after-refresh.png)

The IAB's programmatic date fill changed the native date value without firing the controlled dashboard change handler; native ArrowDown input and week/day navigation updated it correctly. This was not represented as a product failure or a passing programmatic-fill test. Failure/conflict/late-callback sequences are automated UI/emulator tests; not every such case was repeated manually in the browser.

## Remaining boundaries

The emulator has no import/export configured: stopping it discards local backend data. Cloud provisioning/rules deployment, hosted persistence and real multi-device operation remain unverified/unperformed. Overlap warnings are advisory against observed records, not distributed exclusion locks. Current loading reads the student's collections together; no pagination or large-dataset performance claim. Actual OS reduced-motion switching, true 200% zoom, formal user evaluation, lecturer Firestore/ERD approval and the original full capstone acceptance matrix remain separate. Team ownership/review and genuine contributions still need agreement/evidence.

Codex crashed after browser verification. Recovery confirmed all changed files, four RED commits, final test logs and seven screenshots were preserved; servers had stopped. Documentation/notes and the final local GREEN checkpoint were then completed. No verification result was invented from the crash state.
