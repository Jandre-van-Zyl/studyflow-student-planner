import { Timestamp } from 'firebase/firestore';
import { vi } from 'vitest';
import type { AuthContextValue } from '@/features/auth/authContext';
import { defaultStudyBudgets } from '@/features/auth/profileValidation';
import type { UserProfile } from '@/shared/types/planner';

export function profileFixture(name = 'Student A', revision = 1): UserProfile {
  return {
    displayName: name,
    timezone: 'Africa/Johannesburg',
    studyBudgetMinutes: defaultStudyBudgets(),
    createdAt: new Timestamp(1, 0),
    updatedAt: new Timestamp(revision, 0),
  };
}
export function authFixture(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'signed-out',
    mode: 'emulator',
    setupDisplayName: '',
    user: null,
    profile: null,
    error: null,
    register: vi.fn().mockResolvedValue(undefined),
    signIn: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    retryProfile: vi.fn(),
    recheckAccess: vi.fn().mockResolvedValue(undefined),
    sendVerification: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
