# CTU student interface identity

Current override, 21 October 2026: the official CTU logo, observed burgundy/navy/cyan website palette and system sans-serif headings now replace the historical no-logo/teal/Georgia description below. See [brand reference](CTU_Brand_Reference.md), [review](../reviews/StudyFlow_Review_2026-10-21.md) and [onboarding verification](../testing/Onboarding_and_Readability_2026-10-21.md). Earlier sections are dated history.

Implemented19October2026 at `0032c5b`, following Jandre's request for a CTU-focused planner and the selected verified-email/team-approved-list admission model.

The working product name remains StudyFlow. The shared brand now adds “CTU student planner”; every route title ends “StudyFlow for CTU”. Account copy explicitly covers CTU modules, deadlines, study time and approved student email. The footer identifies Group1's capstone context. HTML metadata carries the same identity.

The existing notebook-style paper/navy/teal palette, Georgia/Segoe typography, StudyFlow mark, layouts and motion are retained. No official CTU logo or borrowed brand imagery was supplied for this change; no institutional approval or launch is claimed. Lecturer workspaces, attendance, quizzes and CampusOnline integration remain outside this implementation.

The live empty dashboard now directs users to subjects, classes and deadlines. Only the explicitly disabled layout preview refers to its Load example week button. This preserves the boundary between actual saved records and example data.

## Verification

- `npm run check`: formatting, types, production build and168app tests passed. ESLint0errors;1pre-existing AuthProvider cleanup warning.
- `npm run build:cloud`: passed with the issued public web configuration.
- Real cloud preview: all six route headings, CTU titles, shared brand and navigation verified on desktop; no page overflow observed.
- At320CSSpixels, dashboard/header/menu, seven-field settings and signed-out login had no horizontal page overflow. Drawer navigation reached settings and focused the main region. The dashboard screenshot was visually reviewed; login reflow was checked through rendered DOM geometry. Temporary viewport override was reset.
- Sign out removed private navigation; a direct `/planner` visit returned to sign in.
- The empty-dashboard regression was RED at `8e890d5` (1failure/6passes), then GREEN in the same target; combined route/account/workspace target26passes.
- No schema, rules, account permission, package or dependency change. No public Hosting release or GitHub publication.

Screenshots and exact task status are retained privately in Jandre's persistent planning folder. These are implementation checks, not student usability research or formal accessibility certification. Coverage percentage, true200%browser zoom and actual device testing are not claimed.
