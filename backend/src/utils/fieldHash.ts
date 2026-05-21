import crypto from 'crypto';
import { normalizePan } from './documentValidation.js';

const lookupKey = (): string => {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY must be defined in the environment variables');
  }
  return process.env.ENCRYPTION_KEY.slice(0, 64);
};

/** Deterministic hash for PAN uniqueness checks (encrypted PAN uses random IV). */
export function hashPanForLookup(pan: string): string {
  return crypto.createHmac('sha256', lookupKey()).update(normalizePan(pan)).digest('hex');
}
