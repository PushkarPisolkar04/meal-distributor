// Input validation + sanitization. Used by the UI before writes and mirrored by
// Firestore Security Rules on the server, so bad data is rejected on both sides.

import { parseHHmm } from './datetime';

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** At least 6 chars, matching Firebase Auth's minimum. */
export function isValidPassword(value: string): boolean {
  return typeof value === 'string' && value.length >= 6;
}

export function isValidHHmm(value: string): boolean {
  return parseHHmm(value) != null;
}

/** Money amounts must be finite, non-negative and at most 2 decimals. */
export function isValidAmount(value: number): boolean {
  if (!Number.isFinite(value) || value < 0) return false;
  return Math.round(value * 100) === value * 100;
}

/** Prices must be positive. */
export function isValidPrice(value: number): boolean {
  return isValidAmount(value) && value > 0;
}

/** Join codes: 6 upper-case alphanumerics, unambiguous (no O/0/I/1). */
const JOIN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function isValidJoinCode(value: string): boolean {
  return /^[A-Z0-9]{6}$/.test(value.trim().toUpperCase());
}

/** Deterministic-length random join code from the safe alphabet. */
export function generateJoinCode(rand: () => number = Math.random): string {
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    const idx = Math.floor(rand() * JOIN_ALPHABET.length) % JOIN_ALPHABET.length;
    out += JOIN_ALPHABET[idx];
  }
  return out;
}

/** Basic UPI VPA shape check, e.g. name@bank. */
export function isValidUpiId(value: string): boolean {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim());
}

/** Trim, collapse whitespace and cap length to keep names tidy and safe. */
export function sanitizeName(value: string, maxLen = 40): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

export function isNonEmptyName(value: string): boolean {
  return sanitizeName(value).length >= 2;
}
