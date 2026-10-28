import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

/** Hashes a password with scrypt and a random salt. Format: scrypt$<salt hex>$<hash hex>. */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

// Used when the email is unknown so a login attempt takes about as long either way.
const DUMMY_HASH = 'scrypt$00000000000000000000000000000000$' + '0'.repeat(KEY_LENGTH * 2);
export const burnPasswordCheck = (password) => verifyPassword(password, DUMMY_HASH);
