/**
 * One-off migration: hash any user.password still stored in plain text.
 * Safe to re-run (it skips rows already starting with the bcrypt prefix).
 *
 *   npx tsx scripts/hash-passwords.ts
 */
import { db } from '../src/infra/database/connection';
import { users } from '../src/infra/database/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, isHashed } from '../src/infra/security/crypto';

const allUsers = db.select({ id: users.id, email: users.email, password: users.password }).from(users).all();

let migrated = 0;
let skipped = 0;
for (const u of allUsers) {
  if (isHashed(u.password)) { skipped++; continue; }
  const hashed = hashPassword(u.password);
  db.update(users).set({ password: hashed }).where(eq(users.id, u.id)).run();
  migrated++;
  console.log(`✓ hashed user id=${u.id} email=${u.email}`);
}
console.log(`\nDone. migrated=${migrated} skipped=${skipped}`);
