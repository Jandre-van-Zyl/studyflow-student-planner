import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/features/auth/authContext';
import { Icon, type IconName } from './Icon';
import { Modal } from './Modal';

const navigation: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/subjects', label: 'Subjects', icon: 'subjects' },
  { to: '/assessments', label: 'Assessments', icon: 'assessments' },
  { to: '/planner', label: 'Weekly planner', icon: 'planner' },
  { to: '/account', label: 'Account', icon: 'account' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export function AppShell() {
  const { status, profile, mode, signOut, user } = useAuth();
  const location = useLocation();
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(location.pathname);
  const privateShell = status === 'ready' || status === 'disabled';
  const showMenu = privateShell && menuAt === location.key;
  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      main.current?.focus();
      window.scrollTo?.({ top: 0, behavior: 'instant' });
      previousPath.current = location.pathname;
    }
    document.title = `${navigation.find((item) => item.to === location.pathname)?.label ?? 'Page not found'} · StudyFlow for CTU`;
  }, [location.pathname]);
  useEffect(() => {
    const query = window.matchMedia?.('(min-width: 1024px)');
    const close = () => {
      if (query?.matches) setMenuAt(null);
    };
    query?.addEventListener('change', close);
    return () => query?.removeEventListener('change', close);
  }, []);
  const links = (
    <nav aria-label="Main navigation" className="space-y-1">
      {navigation.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} className="nav-link" onClick={() => setMenuAt(null)}>
          <Icon name={icon} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
  const brand = (
    <NavLink
      to="/dashboard"
      className="flex min-h-11 w-fit items-center gap-3 text-xl font-semibold text-ink"
      aria-label="StudyFlow for CTU home"
    >
      <img src="/favicon.svg" alt="" className="h-8 w-8" />
      <span>
        <span className="block">StudyFlow</span>
        <span className="block text-xs font-normal text-muted">CTU student planner</span>
      </span>
    </NavLink>
  );
  return (
    <div
      className={`mx-auto min-h-dvh max-w-[1280px] px-4 sm:px-6 lg:px-8 ${privateShell ? 'lg:grid lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-8' : ''}`}
    >
      <a
        href="#main-content"
        className="sr-only z-50 bg-white p-3 focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      {privateShell ? (
        <>
          <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line py-8 pr-6 lg:flex">
            {brand}
            <div className="mt-10">{links}</div>
            <div className="mt-auto border-t border-line pt-5">
              <p className="break-words text-sm font-semibold text-ink">
                {profile?.displayName ?? 'Layout preview'}
              </p>
              <p className="mt-1 text-xs text-muted">
                {mode === 'emulator'
                  ? 'Local demo account'
                  : status === 'disabled'
                    ? 'No account connected'
                    : 'Private account'}
              </p>
              {status === 'ready' && (
                <button
                  className="text-link text-sm"
                  onClick={() => {
                    void signOut().catch(() => {});
                  }}
                >
                  Sign out
                </button>
              )}
            </div>
          </aside>
          <header className="flex items-center justify-between gap-3 border-b border-line py-3 lg:hidden">
            {brand}
            <button
              type="button"
              className="btn btn-secondary"
              aria-expanded={showMenu}
              aria-haspopup="dialog"
              onClick={() => setMenuAt(location.key)}
            >
              Menu
            </button>
          </header>
          {showMenu && (
            <Modal title="Navigation" drawer onClose={() => setMenuAt(null)}>
              {links}
              <p className="mt-8 break-words text-sm text-muted">
                {profile?.displayName ?? 'Layout preview'}
              </p>
              {status === 'ready' && (
                <button
                  className="text-link"
                  onClick={() => {
                    setMenuAt(null);
                    void signOut().catch(() => {});
                  }}
                >
                  Sign out
                </button>
              )}
            </Modal>
          )}
        </>
      ) : (
        <header className="border-b border-line py-5">{brand}</header>
      )}
      <main
        ref={main}
        id="main-content"
        tabIndex={-1}
        className={`min-w-0 py-8 focus:outline-none lg:py-10 ${privateShell ? '' : 'mx-auto max-w-[560px] lg:pt-14'}`}
      >
        <div key={user?.uid ?? status}>
          <Outlet />
        </div>
        <footer className="mt-12 flex flex-wrap justify-between gap-2 border-t border-line pt-5 text-xs text-muted">
          <span>CTU student planner · Group 1 capstone</span>
          <span>All times SAST · UTC+02:00</span>
        </footer>
      </main>
    </div>
  );
}
