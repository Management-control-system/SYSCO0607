/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Teacher } from './types';

/**
 * Dynamically computes a teacher's monthly salary / dues based on current students and payment rules
 */
export function calculateTeacherCompensation(teacher: Teacher, students: Student[]): number {
  if (teacher.compensationType === 'fixed') {
    return teacher.compensationValue;
  } else if (teacher.compensationType === 'hourly') {
    return teacher.compensationValue * teacher.hoursWorked;
  } else if (teacher.compensationType === 'percentage') {
    // Sum total fees of active students enrolled in this teacher's subject
    const subjectStudents = students.filter(
      s => s.subject.trim() === teacher.subject.trim() && s.status === 'active'
    );
    const totalFees = subjectStudents.reduce((sum, s) => sum + s.amount, 0);
    return Math.round(totalFees * (teacher.compensationValue / 100));
  }
  return 0;
}

/**
 * Extracts initials of an Arabic or English name for avatar placement
 */
export function getInitials(name: string): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return 'ن';
  return parts.map(part => part[0]).join('');
}

/**
 * Format currency to beautiful Arabic readable format
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ar-DZ') + ' دج';
}

/**
 * Save data securely to LocalStorage helper
 */
export function getSavedState<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading State from LocalStorage:', error);
  }
  return defaultValue;
}

export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving State to LocalStorage:', error);
  }
}

/**
 * Local (offline-mode) PIN hashing using the browser's built-in Web Crypto
 * API (PBKDF2-SHA256). Used only when no cloud/Firebase connection is
 * configured, so PINs saved to this device's localStorage aren't kept in
 * plain text either. Format: "webcrypto:<saltHex>:<hashHex>".
 */
async function pbkdf2Hex(pin: string, saltBytes: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPinLocal(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = await pbkdf2Hex(pin, salt);
  return `webcrypto:${saltHex}:${hashHex}`;
}

export async function verifyPinLocal(pin: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  // Legacy plaintext PINs saved before this update — compared directly so
  // existing local logins keep working; they get re-hashed on next save.
  if (!stored.startsWith('webcrypto:')) {
    return stored === pin;
  }
  const parts = stored.split(':');
  if (parts.length !== 3) return false;
  const [, saltHex] = parts;
  const salt = new Uint8Array((saltHex.match(/.{1,2}/g) || []).map(b => parseInt(b, 16)));
  const hashHex = await pbkdf2Hex(pin, salt);
  return hashHex === parts[2];
}
