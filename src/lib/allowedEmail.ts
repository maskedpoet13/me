/** Phase 1 has exactly one allowed email. Compare case-insensitively, ignoring spaces. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isAllowedEmail(candidate: string, allowed: string | undefined): boolean {
  if (!allowed) return false;
  return normalizeEmail(candidate) === normalizeEmail(allowed);
}

export const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL as string | undefined;
