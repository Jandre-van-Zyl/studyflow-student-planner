# StudyFlow team delivery backlog

Proposed 15 October 2026 plan. **Dewald is the confirmed team lead; Aneesah is the confirmed minute-taker.** Technical owners below are proposed assignments to confirm against skills/availability. The student-planner direction and minimal-stack constraint are confirmed; the five Group 1 students are the user-confirmed client; the final name, stack adoption and supervisor approval remain open. No application implementation has been performed.

Read with `Student_Planner_Full_Project_Plan.md` and `Student_Planner_Requirements_and_Tests.md`.

## 1 Roles and module ownership

| Owner proposal | Module | Deliverable contract | Collaboration boundary |
| --- | --- | --- | --- |
| Jandre | A Accounts/shared foundation | Auth/profile, application shell, shared types, Firebase services setup, owner/rules validation and integration support. FR-01/02, privacy/data-error NFR. | Own shared contracts/security review; other owners contribute validation/rules tests for their entities. |
| Riaan | B Subjects/classes | Subject management, class-slot form/service, date-range occurrences and validations. FR-03/04. | Own subjects/classes feature folder; consume shared time/types rather than duplicate them. |
| Dewald | C Assessments | Assessment form/list, filters, status/effort/archive flow and validation. FR-05/06/07. | Lead coordination is additional; avoid absorbing everyone's unfinished code. |
| Omphemetse | D Week/study blocks | Weekly combined display, study-block form/state and clash warning. FR-08/09/10. | Consume class occurrence and assessment contracts; do not fork their source data. |
| Aneesah | E Dashboard/advice/workload | Rule ordering/explanations, daily allocation, counts and dashboard widgets. FR-11/12. | Own pure functions/calculation tests; keep real meeting minutes/actions as the confirmed additional role. |

Each owner writes real code and appropriate tests, reviews another module, supplies relevant design/screenshot/evidence notes and explains their part in the demo. Assign a testing-workbook coordinator at the meeting; all owners execute tests. Chapter/source coordination is shared and can be redistributed because meeting administration and lead duties consume time.

## 2 Setup and design decisions before coding

| ID | Decision/task | Proposed responsible person | Target | Evidence/status |
| --- | --- | --- | --- | --- |
| PLAN-01 | Record the five Group 1 students' real planning scenarios, needs and participant/data approach. | Dewald coordinates; all contribute | Thu 15 Oct | Client/stakeholders confirmed by Jandre; gathering evidence still pending. |
| PLAN-02 | Confirm Firestore acceptance for schema/normalisation deliverables; then adopt or revise stack. | Dewald | Before final architecture/proposal lock | Pending; do not assume NoSQL evidence automatically accepted. |
| PLAN-03 | Review working name, Must scope, acceptance criteria and proposed technical ownership. | Entire group; Aneesah records decisions | Thu 15 Oct | Pending group agreement. |
| PLAN-04 | Gather GitHub names, availability and environment constraints; assign repository/Firebase owner and authorized setup actions. | Dewald/Jandre proposal | Thu-Fri | Pending; no accounts/repository created by assistant. |
| PLAN-05 | Review Group1_Week1.pdf: lead, specific problem/context, Group 1 as client/stakeholders and high-level method. | Dewald with group input | Thu evening internal target | One-page PDF drafted and checked 15 Oct; group review/submission/approval pending. |

## 3 Implementation backlog

Dates are proposed internal targets after the required approval/authorization. All entries are **Planned, not implemented**. If actual approval/availability changes, update dates and scope explicitly.

| Task | Owner proposal | Work/output | Dependencies | Target/checkpoint |
| --- | --- | --- | --- | --- |
| DEV-01 | Jandre | Small React/TypeScript Vite workspace, Tailwind integration, shared shell/components and planned check scripts. | Agreed stack/scope | Fri 16 Oct |
| DEV-02 | Jandre, reviewed by all | Shared typed entities, service interfaces, timezone rules, fixtures and field constraints. | DEV-01/data review | Fri 16 Oct |
| DEV-03 | Jandre | Emulator-first Auth/profile/rules skeleton; deny other users; own test accounts only after authorized setup. | DEV-02 | Fri-Sat 16-17 Oct |
| DEV-04 | Riaan | Subject UI/service, archive behaviour, initial class-slot model/form and occurrence tests. | DEV-02; fixture adapter permits parallel UI work | Sat 17 Oct |
| DEV-05 | Dewald | Assessment form/list and valid save/read against the agreed data adapter. | DEV-02/03/04 integration | Sat 17 Oct |
| DEV-06 | Omphemetse | Week-view structure and dated study-block form using agreed fixture contracts, then real services. | DEV-02; class/assessment interfaces | Sat-Sun 17-18 Oct |
| DEV-07 | Aneesah | Priority/budget pure functions, boundary tests and dashboard components with fixtures. | DEV-02, published calculation contracts | Sat-Sun 17-18 Oct |
| DEV-08 | All; Jandre coordinates technical integration | First vertical slice: sign in, create subject, save assessment and see it on dashboard after reload. | DEV-03/04/05/07 | Sun 18 Oct internal review |
| DEV-09 | All | Genuine reviewed commits from every member, not only empty scaffolds; README, rules/schema design and documented early development evidence. | Each owner's actual work | Before Mon 19 Oct 12:00 |
| DEV-10 | Dewald | Complete/reopen/archive/search/filter acceptance and tests; block-history labels agreed with D. | DEV-05 | Mon-Tue 19-20 Oct |
| DEV-11 | Riaan | Class time/range/ownership rules tests and active-week display integration. | DEV-04/06 | Mon-Tue 19-20 Oct |
| DEV-12 | Omphemetse | Study-block saving/status, combined calendar, conflict warnings and mobile day view. | DEV-06/10/11 | Tue-Wed 20-21 Oct |
| DEV-13 | Aneesah | Live data advice/workload/counts, zero/cancelled cases, accessible explanations; no extra backend. | DEV-07 and integrated services | Tue-Wed 20-21 Oct |
| DEV-14 | Jandre + each module owner | Complete rules/schema tests, account-switch cleanup, shared errors and Firebase listener/read review. | DEV-03 and feature validations | By Wed 21 Oct |
| DEV-15 | All | Full Must acceptance/retest, device/keyboard checks, seed/reset demo data, README clean run. | DEV-10 through DEV-14 | Thu 22 Oct |
| DEV-16 | Only if core green | At most one agreed optional feature, normally CSV export. | All Must requirements passing | No later than scope freeze; otherwise omit |
| DEV-17 | All; appointed coordinator | Apply review/user feedback, fix actual defects and repeat affected checks; final release candidate. | Week 4 feedback/actual evaluation | 24-27 Oct |

Use fixtures to work in parallel while contracts are agreed, but replace them in the assessed working flow with persistent data. Clearly label prototype/mock evidence; it is not proof of integration. Each module's UI must demonstrate more than a styled empty page before claiming implementation.

## 4 Academic and management work alongside code

| Task | Coordination proposal | Work/evidence | Due |
| --- | --- | --- | --- |
| DOC-01 | Riaan with all | Chapter 1: confirmed context, problem, aim, 3-5 objectives/questions, solution, scope/significance. | Week 2, Mon 19 Oct 12:00 |
| DOC-02 | Aneesah coordinates; distribute sources | Chapter 2 and literature matrix: three comparable systems critically reviewed, technology choices, evidence-supported local gap and Harvard sources; eight sources recommended. | Week 2 |
| DOC-03 | Dewald with each owner | Chapter 3 and full SRS: actual gathering, FR/NFR, use cases, justified iterative method vs alternative, ethics/privacy/security. | Week 3, same Monday deadline |
| DOC-04 | Jandre/Omphemetse with each owner | Architecture, UML as relevant, logical entity/document model, data dictionary, accepted schema evidence, wireframes and technology justification. | Week 3 |
| DOC-05 | Dewald; Aneesah records real meetings | Charter/work plan, roles/declaration, ethical form and any real sign-off, attendance, weekly progress and risk/issue/change records. | Week 2/3 and ongoing |
| DOC-06 | Every owner; testing coordinator to agree | Test Plan, test cases with actual results, defect/fix/retest log, requirements traceability and environment/evidence references. | Week 4, Fri 23 Oct 12:00 |
| DOC-07 | Omphemetse/Jandre coordination proposal | Complete Chapter 4 with actual environment, features/screenshots, code/design decisions and all-member Git evidence. | Week 4 |
| DOC-08 | Testing coordinator with all | Chapter 5, real performance/usability data and feedback, failures/limits, requirement evaluation. | Week 4 draft; final refinement |
| DOC-09 | All; Dewald package review | Combined front matter/Chapters 1-5, short Chapter 6 outline, similarity check, walkthrough/access, presentation outline, Demo Script and each individual's form. | Week 4 |
| DOC-10 | All | Complete Chapter 6: objective achievements, research answers, limitations, recommendations and future work; final references/appendices. | By 27 Oct internal review |
| DOC-11 | All; lead coordinates | Rehearsal, clean run and final package audit; each member explains decisions/code/tests; backup ready. | Wed 28 Oct internal target |

### External submission milestones

- **Friday 16 October, before morning practical:** Dewald submits Group1_Week1.pdf via Teams. Record actual submission and supervisor approval separately.
- **Monday 19 October at 12:00:** Group1_Week2.pdf and Group1_Week3.pdf submitted together via Teams. Repository link on first page of each; full SRS included in Week 3 PDF. Revise prior work using available real feedback.
- **Friday 23 October at 12:00:** Group1_Week4.pdf and working-app/access evidence; repository and walkthrough links on page 1. Include all Week 4 items, not only code.
- **Thursday 29 October:** complete dissertation, source/evidence/presentation package through official portal; final cutoff and presentation slot to confirm. Live demo, formal attire, similarity below 15% and genuine contribution evidence required.

## 5 Integration and review rules to agree

One repository and lockfile, shared types/date helpers/service conventions, small feature branches and descriptive commits. Pull/merge review by another member; check types/lint/tests/build before integration. No shared private keys/passwords in Git or chat. Agree who can approve integration and how urgent fixes are reviewed. These are proposed working conventions, not evidence they were followed.

Short daily check-in: actual completed output/commit, next action, blocker, help needed. Record blockers early, with an owner and decision time. Aneesah records decisions/actions; Dewald coordinates priorities and external deadlines. Update the supplied work/attendance/contribution records with real work.

## 6 Scope freeze and cuts

The core should be integrated by **Wednesday 21 October** to leave Thursday for testing, evaluation, fixing and recording. Freeze new features at that checkpoint. If behind, remove CSV/timer/dark-mode ideas, simplify animations and keep a clear seven-day agenda/day list. If an accepted Must is genuinely infeasible, obtain and record a scope change with its impact on objectives/tests; do not quietly mark it complete.

Critical dependencies: actual client/data access, Firestore acceptance, member React/TypeScript familiarity, Firebase project/setup authorization, and meaningful availability over the weekend. This schedule is not evidence the work will fit without those conditions.

## 7 Risks and mitigation ownership

| Risk | Proposed owner | Mitigation/checkpoint |
| --- | --- | --- |
| Firestore not accepted for required schema/normalisation evidence | Dewald | Obtain answer before committing to data architecture. Preserve a clear logical model and rationale. |
| Team learning too many tools during short schedule | Dewald with all | Verify skills now; use one React app and Firebase services, shared components and contracts. |
| Client/gathering/evaluation unavailable | Dewald | Arrange a real representative/participants early and document limitations/approved changes. |
| Insecure rules despite attractive UI | Jandre + module owners | Emulator deny/validation tests before cloud access and before recording. |
| Date/conflict/priority inconsistency | B/D/E owners | Shared SAST helpers, one time snapshot and golden boundary tests. |
| One member carries integration/testing | Dewald | Meaningful feature/test ownership, review partners and actual contribution tracking. |
| Quota/network failure affects demo | Jandre | Bounded reads, listener cleanup, monitor usage, tested local/emulator backup and recorded walkthrough. |
| Optional feature expansion consumes test time | Entire group | Core freeze and one optional feature only when green. |

All risk/implementation statuses remain planned/open unless actual evidence is recorded. No interviews, tests, completed features, source-code commits or cloud actions are implied by this backlog.
