import { Link } from 'react-router';
import { Icon, type IconName } from '@/shared/components/Icon';

const spaces: { title: string; description: string; to: string; icon: IconName; colour: string }[] =
  [
    {
      title: 'Build your week',
      description: 'Keep your subjects and class times together.',
      to: '/subjects',
      icon: 'subjects',
      colour: 'bg-sky-50 text-sky-700',
    },
    {
      title: 'See what matters',
      description: 'Bring deadlines and remaining work into focus.',
      to: '/assessments',
      icon: 'assessments',
      colour: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Make time to study',
      description: 'Give your study sessions a place in your week.',
      to: '/planner',
      icon: 'planner',
      colour: 'bg-teal-50 text-teal-700',
    },
  ];

export function DashboardPage() {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Your student workspace
        </p>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
          Foundation preview
        </span>
      </div>
      <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
        Make room for
        <br className="hidden sm:block" /> what matters.
      </h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
        A calmer place to organise your deadlines, see your week and decide what comes next.
      </p>
      <div className="mt-9 grid gap-4 xl:grid-cols-3">
        {spaces.map(({ title, description, to, icon, colour }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-3xl border border-slate-200 bg-white p-6 transition-colors hover:border-teal-400"
          >
            <span className={`inline-flex rounded-xl p-3 ${colour}`}>
              <Icon name={icon} className="h-6 w-6" />
            </span>
            <h2 className="mt-6 text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            <span className="mt-6 flex items-center gap-2 text-sm font-semibold text-accent">
              Explore workspace
              <Icon name="arrow" className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-6 rounded-3xl bg-ink p-7 text-white sm:p-9">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-teal-200">
          One step at a time
        </p>
        <h2 className="mt-3 text-2xl font-semibold">Your planner is taking shape.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
          The navigation and shared workspace are ready. Accounts, saved assessments, study sessions
          and planning insights will be added next. No sample records are presented as your real
          data.
        </p>
      </div>
    </section>
  );
}
