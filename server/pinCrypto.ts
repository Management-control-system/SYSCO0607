/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PIN hashing helpers (server-side).
 *
 * PINs must never be stored or transmitted in plain text. We use Node's
 * built-in scrypt KDF (no extra dependency needed) with a random salt per
 * PIN. Stored format: "scrypt:<saltHex>:<hashHex>".
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 64;

export function hashPin(plainPin: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(plainPin, salt, KEY_LENGTH).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPin(plainPin: string, stored: string): boolean {
  if (!stored || !stored.startsWith('scrypt:')) {
    return false;
  }
  const parts = stored.split(':');
  if (parts.length !== 3) return false;
  const [, salt, hashHex] = parts;
  try {
    const derived = scryptSync(plainPin, salt, KEY_LENGTH);
    const stored_ = Buffer.from(hashHex, 'hex');
    if (derived.length !== stored_.length) return false;
    return timingSafeEqual(derived, stored_);
  } catch {
    return false;
  }
}

/** True if a value looks like an already-hashed PIN (vs. legacy plaintext). */
export function isHashed(value: string): boolean {
  return typeof value === 'string' && value.startsWith('scrypt:');
}
