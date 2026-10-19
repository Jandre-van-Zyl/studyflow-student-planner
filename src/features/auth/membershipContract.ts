import type { ApprovedStudent } from '@/shared/types/membership';

export function membershipEmail(email: string | null): string | null {
  const normalized = email?.toLowerCase();
  return normalized &&
    normalized.length <= 254 &&
    /^[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}$/.test(normalized)
    ? normalized
    : null;
}

export function activeMembership(value: unknown): value is ApprovedStudent & { active: true } {
  return (
    !!value &&
    typeof value === 'object' &&
    Object.keys(value).length === 1 &&
    'active' in value &&
    value.active === true
  );
}
