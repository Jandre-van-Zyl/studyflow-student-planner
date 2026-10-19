/** Administrator-owned document at approvedStudents/{normalizedEmail}. */
export interface ApprovedStudent {
  active: boolean;
}
export type MembershipStatus = 'checking' | 'approved' | 'denied';
