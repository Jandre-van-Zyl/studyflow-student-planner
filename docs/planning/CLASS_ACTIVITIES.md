# Class activities and facilitator workspace

21 October 2026. Jandre requested a Class activities tab now and facilitator integration later. This supersedes the earlier idea-only restriction for the tab and these requirements. It does not claim that the future services exist.

## Available now

The authenticated app has `/class-activities` in desktop and mobile navigation. It explains the planned workspace and links to the existing assessments screen. It has no fake activities, upload controls, notification counts or attendance totals. Existing planner data and cloud CTU imports are unchanged.

CTU FA titles are assignments. A separate FA label, including numbered forms such as `FA1`, `FA 1` and `KM-05_FA1`, defaults the planning form to Assignment. Assignment actions use **Plan assignment**, **Work minutes remaining** and **Save assignment plan**. Unrecognised labels, including SA, still require an explicit type. The type remains editable; resync does not rewrite a student's existing planner choices. Time estimates describe unfinished assignment work, not test revision. No completed status is inferred from an observed upload.

## Future student and facilitator workflows

1. An administrator approves a facilitator and assigns specific classes/modules. The facilitator manages the membership of those classes, not every CTU student. A class is a roster, not merely a matching module title from a portal import.
2. The facilitator drafts an activity with title, instructions, class/module, opening time, due date/time in SAST, attachments, submission requirements and whether it contributes to participation. Drafts are private until published.
3. Active class members see published activities, dates and targeted in-app notifications. Publishing, changing a deadline or cancelling an activity updates the existing item and notice; retries must not create duplicate tasks. Students outside the roster cannot read the activity or its files.
4. Students open instructions, download permitted resources and submit their own files or text, as configured. The interface shows upload progress, errors, a server-confirmed receipt and submission time. Resubmission/late-work rules must be visible before submitting. A failed upload does not count as submitted.
5. A facilitator can create a short after-class quiz directly in StudyFlow. Start with single-choice questions, an opening time, deadline, one final attempt and explicitly configured feedback release. Questions and attempts persist; draft answers may be resumed. Correct answers must not be delivered to a student before the configured release. Submitted attempts are immutable except for a separately recorded facilitator correction.
6. The facilitator sees only their assigned class's submissions, quiz attempts and participation summary. Students see only their own submissions, attempts and feedback. Classmates must not be able to list or download one another's work.
7. Submission/quiz completion can provide participation evidence. Attendance is a separate, facilitator-reviewed record with a session date, status, reviewer and correction history. Logging in, downloading a file or completing a quiz does not automatically prove physical attendance. Any official attendance-credit policy needs CTU confirmation; the planner must not claim it updates CampusOnline marks or attendance.
8. Activity/quiz deadlines appear in the student's agenda. Personal effort and planned work blocks remain in the student's planner; facilitators cannot overwrite private notes or study budgets. Cancellation retains submissions and history while clearly marking the item cancelled.

## Contract to design before backend implementation

Keep shared class data separate from the existing private `users/{uid}` planner documents. The current profile schema has no facilitator role field, and its rules must not be relaxed to allow self-promotion.

| Proposed entity                                | Responsibility                                                                                                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Facilitator authorization and class membership | Administrator-approved role, assigned class IDs, active/revoked membership and audit timestamps. No client-selectable privileged role.                               |
| Class and activity                             | Module/class identity, facilitator ownership, instructions, draft/published/cancelled state, opening/due times and revision.                                         |
| Attachment                                     | Private object identifier, sanitized display name, validated media type/size, uploader and parent activity/submission. No permanent public download URL.             |
| Submission                                     | Activity/student identity, attempt/version, attachment references, server timestamp, late status and receipt. Preserve prior versions where resubmission is allowed. |
| Quiz and answer key                            | Student-readable published questions separated from protected keys and scoring. Decide a trusted grading mechanism before promising automatic scoring.               |
| Quiz attempt                                   | Student, quiz version, answers, draft/final state, server submission time and feedback release. Enforce the deadline and attempt limit server-side.                  |
| Participation and attendance                   | Evidence reference, separate facilitator-reviewed attendance state, reviewer and correction history. No automatic official attendance claim.                         |
| Notification                                   | Class recipient scope, source ID/revision, reason, creation time and per-student read state. Idempotent generation, no cross-class leakage.                          |

These are proposed responsibilities, not deployed collections or final schemas. Define exact field limits, types, transactions, indexes, access rules and deletion/retention policy together before implementing them.

## Zero-cost and delivery gates

- Preserve the zero-cost/no-billing requirement. File storage, private downloads, upload quotas and trusted quiz scoring need a verified compatible solution before implementation. Do not enable a billable service or put binary files/base64 uploads in Firestore as a workaround.
- Keep the first notification channel in-app. Email, push notifications and external messages require a separate implementation decision.
- First deliver approved roles and roster isolation with emulator tests, then activity publishing and targeted notices, then private submissions, then quizzes, then participation/attendance review and planner links. Do not expose an apparently working publish/upload/submit button until its service and error handling work.
- Test unauthorized/self-promoted roles, wrong classes, revoked membership, shared-browser account changes, private file access, rejected files, partial uploads, deadline boundaries, duplicate publish/submit retries, stale revisions, answer-key secrecy and feedback release. Verify facilitator and student end-to-end journeys independently.
- Existing capstone delivery dates and module ownership remain unchanged until the team agrees how this additional scope fits. This document does not assign teammates new obligations or claim lecturer approval.
