import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Timestamp } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudySetup } from './StudySetup';
import { needsStudySetup } from './studySetupState';
import { useAuth } from '@/features/auth/authContext';
import { saveProfile } from '@/features/auth/profileService';
import { defaultStudyBudgets } from '@/features/auth/profileValidation';
import type { UserProfile } from '@/shared/types/planner';
vi.mock('@/features/auth/authContext');
vi.mock('@/features/auth/profileService');
const stamp = Timestamp.fromMillis(1000);
const profile: UserProfile = {
  displayName: 'Student',
  timezone: 'Africa/Johannesburg',
  studyBudgetMinutes: defaultStudyBudgets(),
  createdAt: stamp,
  updatedAt: stamp,
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({ user: { uid: 'owner' }, profile } as ReturnType<
    typeof useAuth
  >);
});
describe('study routine onboarding', () => {
  it('requires setup only for an untouched zero-budget profile', () => {
    expect(needsStudySetup(profile)).toBe(true);
    expect(needsStudySetup({ ...profile, updatedAt: Timestamp.fromMillis(2000) })).toBe(false);
    expect(
      needsStudySetup({ ...profile, studyBudgetMinutes: { ...defaultStudyBudgets(), 1: 30 } }),
    ).toBe(false);
  });
  it('saves selected days and minutes with the owner and expected revision', async () => {
    vi.mocked(saveProfile).mockResolvedValue(profile);
    render(
      <MemoryRouter>
        <StudySetup />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText('Monday'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText('Monday'), { target: { value: '90' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText(/1h 30m/)).toBeInTheDocument();
    expect(saveProfile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save my routine' }));
    await waitFor(() =>
      expect(saveProfile).toHaveBeenCalledWith(
        'owner',
        { displayName: 'Student', studyBudgetMinutes: { ...defaultStudyBudgets(), 1: 90 } },
        stamp,
      ),
    );
  });
  it('retains the routine and allows retry after a failed save', async () => {
    vi.mocked(saveProfile).mockRejectedValue({ code: 'unavailable' });
    render(
      <MemoryRouter>
        <StudySetup />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save my routine' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be reached/);
    expect(screen.getByRole('button', { name: 'Save my routine' })).toBeEnabled();
  });
});
