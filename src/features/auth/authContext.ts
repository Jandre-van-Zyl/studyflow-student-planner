import { createContext, useContext } from 'react';
import type { UserProfile } from '@/shared/types/planner';
import type { SessionUser } from './authService';

export type SessionStatus =
  | 'disabled'
  | 'loading'
  | 'signed-out'
  | 'verification-required'
  | 'membership-loading'
  | 'membership-denied'
  | 'membership-error'
  | 'profile-loading'
  | 'profile-error'
  | 'ready'
  | 'error';
export interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  profile: UserProfile | null;
  error: string | null;
}
export interface AuthContextValue extends SessionState {
  mode: 'disabled' | 'emulator' | 'cloud' | 'invalid';
  setupDisplayName: string;
  register: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  retryProfile: (name?: string) => void;
  recheckAccess: () => Promise<void>;
  sendVerification: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
