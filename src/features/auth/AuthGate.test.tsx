import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { authFixture, profileFixture } from '@/test/accountFixtures';
import { AuthContext, type SessionStatus } from './authContext';
import { AuthGate } from './AuthGate';
import { Timestamp } from 'firebase/firestore';

function configuredProfile(name = 'Student') {
  const profile = profileFixture(name);
  return { ...profile, updatedAt: Timestamp.fromMillis(profile.createdAt.toMillis() + 1000) };
}

describe('private route boundary', () => {
  it('unmounts arbitrary private feature state when the UID changes directly', () => {
    function Draft() {
      const [value, setValue] = useState('');
      return (
        <input
          aria-label="Private draft"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      );
    }
    function ui(uid: string) {
      return (
        <MemoryRouter>
          <AuthContext.Provider
            value={authFixture({
              status: 'ready',
              user: { uid, email: uid + '@example.test', emailVerified: true },
              profile: configuredProfile(uid),
            })}
          >
            <Routes>
              <Route element={<AuthGate />}>
                <Route index element={<Draft />} />
              </Route>
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );
    }
    const view = render(ui('a'));
    fireEvent.change(screen.getByLabelText('Private draft'), {
      target: { value: 'Only account A' },
    });
    view.rerender(ui('b'));
    expect(screen.getByLabelText('Private draft')).toHaveValue('');
  });
  function show(status: SessionStatus) {
    return render(
      <MemoryRouter initialEntries={['/settings']}>
        <AuthContext.Provider
          value={authFixture({
            status,
            user:
              status === 'ready'
                ? { uid: 'a', email: 'a@example.test', emailVerified: true }
                : null,
            profile: status === 'ready' ? configuredProfile() : null,
          })}
        >
          <Routes>
            <Route path="account" element={<p>Public sign in</p>} />
            <Route element={<AuthGate />}>
              <Route path="settings" element={<p>Private settings</p>} />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
  }
  it.each([
    'signed-out',
    'verification-required',
    'membership-denied',
    'membership-error',
    'profile-error',
    'error',
  ] as const)('redirects %s sessions away from private pages', (status) => {
    show(status);
    expect(screen.getByText('Public sign in')).toBeInTheDocument();
    expect(screen.queryByText('Private settings')).not.toBeInTheDocument();
  });
  it.each(['loading', 'membership-loading', 'profile-loading'] as const)(
    'waits during %s without displaying private content',
    (status) => {
      show(status);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText('Private settings')).not.toBeInTheDocument();
    },
  );
  it.each(['ready', 'disabled'] as const)(
    'permits %s for its intended authenticated/preview use',
    (status) => {
      show(status);
      expect(screen.getByText('Private settings')).toBeInTheDocument();
    },
  );
});
