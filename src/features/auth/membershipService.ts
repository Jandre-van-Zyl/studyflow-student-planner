import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase/client';
import type { MembershipStatus } from '@/shared/types/membership';
import type { SessionUser } from './authService';
import { activeMembership, membershipEmail } from './membershipContract';
export { activeMembership, membershipEmail } from './membershipContract';

export function watchMembership(
  user: SessionUser,
  next: (status: MembershipStatus) => void,
  fail: (error: unknown) => void,
): () => void {
  const email = membershipEmail(user.email);
  if (!user.emailVerified || !email) {
    next('denied');
    return () => {};
  }
  return onSnapshot(
    doc(getFirebaseServices().database, 'approvedStudents', email),
    { includeMetadataChanges: true },
    (snapshot) => {
      // Cached approval cannot unlock private records while the server is unreachable.
      if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) next('checking');
      else next(activeMembership(snapshot.data()) ? 'approved' : 'denied');
    },
    fail,
  );
}
