# StudyFlow Final Submission Checklist

## Report alignment
- [ ] Copy Chapter 4 and Chapter 5 content into the official report template.
- [ ] Replace provisional Chapter 4 headings with the exact approved headings and numbering.
- [ ] Check that requirement IDs and feature names match the approved SRS.
- [ ] Ensure the report describes only features in the final reviewed build.
- [ ] Review spelling, formatting, contents page, captions, and references.

## Test documentation
- [ ] Include `Test_Cases_and_Results_TC01-TC35.md` or transfer it into the team's required format.
- [ ] Include the requirements traceability matrix.
- [ ] Preserve the 35 contributor-reported PASS outcomes and clarify attribution.
- [ ] Preserve DEF-OMP-001 and the initial freeze plus successful retest.
- [ ] Add actual TC-31 timing values and supporting listener/write evidence if required.
- [ ] Include clean-setup and final automated-check output for TC-32.
- [ ] Confirm TC-33 CSV export, TC-34 timer, and TC-35 dark mode were in scope and in the reviewed build.
- [ ] Add only evidence that exists; do not fabricate screenshots or logs.

## Repository and evidence
- [ ] Check that the two available planner evidence images are included in the repository.
- [ ] Leave `docs/evidence/ui/Screenshot 2026-10-26 134019.png` untouched.
- [ ] Review `docs/testing/Omphemetse_Planner_Test_Execution_Record_2026-10-19.md` for accidental terminal text and update the record's date/wording if needed.
- [ ] Rerun `npm.cmd run check` on the final revision and record branch, commit SHA, date, and complete result.
- [ ] Do not run Firebase emulator scripts while an existing emulator process may conflict; check the environment first.
- [ ] Do not commit or push until you explicitly decide to do so.

## Final review
- [ ] Team lead reviews the report and contribution allocation.
- [ ] All team members' contributions are represented accurately.
- [ ] The demo uses a test account and does not expose secrets.
- [ ] Final files follow the team's required naming and submission format.
