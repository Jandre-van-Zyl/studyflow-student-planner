# Persistent planner handoff

**19 October access update:** account/profile/planner admission now requires verified email and an active approved-student entry. Follow [STUDENT_ACCESS.md](STUDENT_ACCESS.md) before the older registration steps below. The same policy applies in emulators; there is no auto-approval. Existing document schemas/services remain unchanged. Cloud deployment remains pending.

Implemented locally on jandre, 16 October 2026, after the requested ECC click-path-audit → contract-first → security-review workflow. This supersedes the earlier UI handoff's preview-only data boundary. No packages, cloud resources or profile settings were added. Technical ownership remains proposed; this work is not teammates' contribution evidence.

## Run

Use the existing Node 24/npm/Java 21 setup. Stop existing servers first. From the repository root, one terminal:

```powershell
npm run dev
```

The command starts Auth/Firestore, waits for readiness and opens http://127.0.0.1:5173/account. Register a disposable test account. Add a subject, class, assessment and block, then refresh: records reload from Firestore. A second account starts empty. Ctrl+C stops everything. Synthetic examples/Clear preview appear only in `npm run dev:preview`; no samples are copied to live accounts. Separate-terminal `npm run emulators` plus `npm run dev:emulator` remains an advanced option.

The local emulator is disposable: without export/import, stopping it discards its backend data. Browser refresh persistence does not imply backend-restart persistence or a hosted deployment. Cloud configuration/rules deployment still requires separate authorization and verification. See [Firebase setup](FIREBASE.md).

## Boundary and extension points

- [Shared document types](../../src/shared/types/planner.ts) and [contract v1](../design/Planner_Data_Contract.md) define fields, limits, enums and semantics. [plannerContract](../../src/features/planner/plannerContract.ts) derives inputs and SAST views, parses stored documents and maps safe errors. Dates cover 2000–2099; subject codes use uppercase letters/digits/hyphens/underscores.
- [plannerService](../../src/features/planner/plannerService.ts) supplies `watchPlanner(uid,next,fail)` and `savePlannerRecord(uid,kind,item)`. Kinds are subjects/classes/assessments/blocks; mappings are subjects/classSlots/assessments/studyBlocks. Reuse the existing Firebase singleton. The UI adapter's captured `revision` is not persisted.
- [PlanningWorkspace](../../src/features/planner/PlanningWorkspace.tsx) owns four server listeners only for ready sessions, initial all-collection loading, retry, generation guards and cleanup. Auth status/UID keys unmount old data immediately. Same-owner listener failures hide/inert the feature tree and suspend dialogs, preserving drafts for explicit retry. Late callbacks/confirmations cannot revive failed or previous-user views.
- [usePlannerMutation](../../src/features/planner/usePlannerMutation.ts) locks duplicate writes and ignores late page completions. Forms close/report success after acknowledged saves only. Failure retains values and a stable creation ID; conflicts require explicitly closing/reopening the latest record. Never silently adopt a newer revision into an old draft.
- Rules enforce exact schemas, own references, server metadata, completion transitions, valid dates/times and future-Done denial. Archive/cancel retains history. Subject-code claims are atomic bookkeeping; no claim lists or feature hard deletes are allowed. Do not bypass the service or relax rules to fix a denial.
- Dashboard calculations consume live collections plus profile budgets through the existing [planningView](../../src/features/planner/planningView.ts) entry points. The 21 October local candidate delegates ranking and allocation to Aneesah's pure helpers; see [dashboard integration](DASHBOARD_INTEGRATION.md) for adapters and display changes. Completion/archiving preserves block allocation/history; cancellation removes allocation. Overlap warnings use the latest observed intervals and renewed confirmation if they change; they are advisory, not a global schedule lock.

## Verification and limits

Stop manual emulators, then run `npm run check`, `npm run test:rules`, `npm run test:integration`. CI already runs these commands. See [executed verification](../testing/Planner_Persistence_Verification_2026-10-16.md) and [click-path audit](../testing/Click_Path_Audit_2026-10-16.md).

No push, PR, Main/team-branch integration, cloud rules deployment, production data migration, portal extension or course submission occurred. Lecturer feedback on Firestore/ERD/normalisation and genuine team contributions remain outstanding. This local verification does not certify every original capstone acceptance case or a security penetration test.
