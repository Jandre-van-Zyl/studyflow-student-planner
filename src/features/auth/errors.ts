import { ProfileValidationError } from './profileValidation';

export class ProfileConflictError extends Error {
  constructor() {
    super('Your profile changed in another session. Reload the latest profile before saving.');
    this.name = 'ProfileConflictError';
  }
}

export function accountErrorMessage(error: unknown): string {
  if (error instanceof ProfileValidationError || error instanceof ProfileConflictError)
    return error.message;
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account already uses this email. Sign in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'Choose a stronger password that meets the account password requirements.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment before trying again.';
    case 'auth/user-disabled':
      return 'This account is unavailable. Contact the project owner.';
    case 'auth/web-storage-unsupported':
    case 'auth/unsupported-persistence-type':
      return 'Browser session storage is unavailable. Allow storage for this site and reload.';
    case 'auth/network-request-failed':
    case 'unavailable':
    case 'deadline-exceeded':
      return 'The service could not be reached. Check your connection and try again.';
    case 'permission-denied':
      return 'Access was denied. Your changes were not confirmed. Try again or contact the project owner.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is unavailable. Contact the project owner.';
    default:
      return 'The request could not be completed. Your changes were not confirmed. Please try again.';
  }
}
