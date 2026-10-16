# StudyFlow - Student Planner

Software Engineering 2 capstone, Group 1, CTU Training Solutions.

## Current status

Repository and planning setup only, 16 October 2026. Application implementation has not started. StudyFlow is the proposed project name. The five Group 1 students are the client and primary stakeholders. The proposal is prepared; submission and supervisor approval have not been verified here.

Proposed stack: React + TypeScript + Tailwind CSS using Vite, with Firebase Authentication and Cloud Firestore. Group adoption and acceptance of Firestore for the required database-design evidence still need confirmation. No Firebase project, billing plan, deployment or application test results are supplied by this setup.

## Team and branches

| Member | GitHub | Confirmed role | Personal branch |
| --- | --- | --- | --- |
| Dewald Van Jaarsveldt | [Dewald-vJ](https://github.com/Dewald-vJ) | Team lead | `dewald` |
| Aneesah Rehman | [charming-leather](https://github.com/charming-leather) | Minute-taker | `aneesah` |
| Riaan Jacobs | [helios5455-cmd](https://github.com/helios5455-cmd) | Team member | `riaan` |
| Jandre Van Zyl | [Jandre-van-Zyl](https://github.com/Jandre-van-Zyl) | Repository owner / team member | `jandre` |
| Omphemetse Dikeledi | [Theoblac](https://github.com/Theoblac) | Team member | `omphemetse` |

**`Main` is the default integration branch. Its capital M is intentional.** Work on your own branch and open a pull request into `Main`. Have another member review before merging. Keep personal branches after merging; sync them with `Main` before the next task. Branches are shared collaboration conventions, not per-member access restrictions.

Invited teammates must accept GitHub's repository invitation before accessing this private repository. Invitation acceptance is separate from being listed in this table.

## Planned core workflow

Sign in to a private planner, create subjects/classes, record assessment deadlines and remaining effort, inspect explained task priority, reserve study sessions in a weekly view, and interpret workload/clash warnings. Complete work and retain history. Optional extras wait until the accepted core passes.

## Project documents

- [Week 1 proposal PDF](docs/proposal/Group1_Week1.pdf)
- [Full proposed project plan](docs/planning/Student_Planner_Full_Project_Plan.md)
- [Requirements and planned tests](docs/planning/Student_Planner_Requirements_and_Tests.md)
- [Proposed delivery backlog](docs/planning/Student_Planner_Delivery_Backlog.md)
- [Contribution and Git workflow](CONTRIBUTING.md)

Planning documents describe proposed features, assignments and tests. They are not evidence of completed implementation, actual research findings or passed tests. The setup commits are repository administration, not five members' coding contributions.

## Clone and select your branch

After accepting your invitation, use your own GitHub account:

```powershell
git clone https://github.com/Jandre-van-Zyl/studyflow-student-planner.git
cd studyflow-student-planner
git switch --track origin/aneesah
```

Replace `aneesah` with your personal branch from the table. Once that local branch exists, use `git switch aneesah`. There is no `npm install` or app launch command yet because application scaffolding has not been created.

## Course checkpoints

| Date, Africa/Johannesburg | Required checkpoint |
| --- | --- |
| Friday 16 October 2026, morning before practical | One-page proposal, `Group1_Week1.pdf`, submitted once by Dewald via Teams to Jabulile Mashibini |
| Monday 19 October 2026, 12:00 | Separate Week 2 and Week 3 PDFs together; research, SRS/design and real early development with meaningful commits from every member |
| Friday 23 October 2026, 12:00 | Working Must features, database, walkthrough, dissertation draft and actual testing/evaluation evidence |
| Thursday 29 October 2026 | Final dissertation, source/evidence and live demonstration; exact final cutoff/presentation arrangements still to confirm |

Put this repository URL on page 1 of submissions from Week 2 onward. Arrange supervisor access to the private repository using the supervisor's confirmed GitHub account or the accepted assessment access method; none is assumed or invited by this setup.

## Working boundaries

- Each person makes their own genuine commits and explains their code, decisions and tests.
- Keep passwords, private keys, Firebase service-account files and local environment values out of Git.
- Runtime versions, app commands, checks and deployment instructions will be documented when the team authorizes implementation.
- Original institutional templates and raw participant records are maintained outside this bootstrap; only the prepared project proposal/plans are included here.
