import { NavLink, Outlet } from 'react-router';
import { useAuth } from '@/features/auth/authContext';
import { Icon, type IconName } from './Icon';

const navigation: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/subjects', label: 'Subjects', icon: 'subjects' },
  { to: '/assessments', label: 'Assessments', icon: 'assessments' },
  { to: '/planner', label: 'Weekly planner', icon: 'planner' },
  { to: '/account', label: 'Account', icon: 'account' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export function AppShell() {
  const { status, profile, mode, signOut } = useAuth();
  return (
    <div className="mx-auto min-h-screen max-w-[1600px] p-4 md:p-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <aside className="rounded-3xl border border-slate-200 bg-white p-5 lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-3rem)] lg:flex-col">
        <NavLink
          to="/dashboard"
          className="flex w-fit items-center gap-3 text-xl font-semibold tracking-tight text-ink"
          aria-label="StudyFlow home"
        >
          <img src="/favicon.svg" alt="" className="h-10 w-10" />
          StudyFlow
        </NavLink>
        <p className="mt-2 text-sm text-slate-500">A little clarity for your week.</p>
        {mode === 'emulator' && (
          <p className="mt-3 text-xs font-medium text-amber-800">Local demo</p>
        )}
        {status === 'ready' && profile && (
          <div className="mt-5 rounded-xl bg-slate-50 p-3">
            <p className="break-words text-sm font-semibold text-ink">{profile.displayName}</p>
            <button
              type="button"
              onClick={() => {
                void signOut().catch(() => {});
              }}
              className="mt-2 min-h-9 text-sm font-semibold text-accent underline"
            >
              Sign out
            </button>
          </div>
        )}
        <nav
          aria-label="Main navigation"
          className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1"
        >
          {navigation.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-ink text-white' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 hidden rounded-2xl bg-teal-50 p-4 lg:mt-auto lg:block">
          <p className="text-sm font-semibold text-accent">Plan a little. Focus a lot.</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            One place for the work ahead and the time you make for it.
          </p>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1} className="min-w-0 py-7 focus:outline-none lg:py-4">
        <Outlet />
        <footer className="mt-12 border-t border-slate-200 pt-5 text-xs text-slate-500">
          StudyFlow · Student Planner · Group 1
        </footer>
      </main>
    </div>
  );
}
