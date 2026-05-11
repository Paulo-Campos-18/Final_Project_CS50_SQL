import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;
const BCRYPT_PREFIX = '$2';

/** Hash a plain-text password with bcrypt (10 rounds). */
export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}

/**
 * Verify a plain-text password against a stored value. Supports backwards
 * compatibility with legacy plain-text passwords seeded before the bcrypt
 * migration — the caller decides whether to re-hash on success.
 */
export function verifyPassword(plain: string, stored: string): {
  ok: boolean;
  needsRehash: boolean;
} {
  if (!stored) return { ok: false, needsRehash: false };
  if (stored.startsWith(BCRYPT_PREFIX)) {
    return { ok: bcrypt.compareSync(plain, stored), needsRehash: false };
  }
  // legacy plain-text — accept only during migration window
  return { ok: plain === stored, needsRehash: true };
}

export function isHashed(stored: string): boolean {
  return !!stored && stored.startsWith(BCRYPT_PREFIX);
}
