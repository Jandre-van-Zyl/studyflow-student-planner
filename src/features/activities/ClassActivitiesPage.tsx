import { Link } from 'react-router';

export function ClassActivitiesPage() {
  return (
    <section>
      <h1>Class activities</h1>
      <p className="mt-3 max-w-[65ch] leading-7">
        A space for work from your CTU facilitator, class updates and short quizzes after a lesson.
      </p>
      <div className="notice mt-6">
        <h2>Facilitator connection coming later</h2>
        <p className="mt-2 leading-7">
          This workspace is being prepared. Class enrolment, announcements, file uploads and quiz
          submissions are not available yet. Your saved CampusOnline assignments are in Assessments.
        </p>
        <Link className="text-link mt-3 inline-block" to="/assessments">
          Open assessments
        </Link>
      </div>
      <h2 className="mt-8">Planned for your classes</h2>
      <dl className="mt-3 divide-y divide-line">
        <div className="py-5 sm:grid sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
          <dt className="font-semibold">Activities &amp; files</dt>
          <dd className="mt-2 leading-7 sm:mt-0">
            View instructions, due dates and files shared by your facilitator. Upload your completed
            class work and see its submission status.
          </dd>
        </div>
        <div className="py-5 sm:grid sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
          <dt className="font-semibold">After-class quizzes</dt>
          <dd className="mt-2 leading-7 sm:mt-0">
            Complete a short quiz in StudyFlow before its due date, then see the feedback your
            facilitator releases.
          </dd>
        </div>
        <div className="py-5 sm:grid sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
          <dt className="font-semibold">Class notifications</dt>
          <dd className="mt-2 leading-7 sm:mt-0">
            Receive announcements, new activities and date changes for the classes you belong to.
            Your facilitator will manage their own classes and students.
          </dd>
        </div>
        <div className="py-5 sm:grid sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
          <dt className="font-semibold">Participation</dt>
          <dd className="mt-2 leading-7 sm:mt-0">
            Keep a record of completed activities and quiz attempts. Facilitators will review these
            for participation and attendance; completing a quiz alone will not confirm attendance.
          </dd>
        </div>
      </dl>
      <p className="help mt-4">
        Class activities are separate from formal assessment marks on CampusOnline.
      </p>
    </section>
  );
}
