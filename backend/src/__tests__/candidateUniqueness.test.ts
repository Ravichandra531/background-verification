import {
  normalizeCandidateEmail,
  normalizeCandidatePhone,
  buildDuplicateVerificationFailure,
} from '../utils/candidateUniqueness.js';
import { hashPanForLookup } from '../utils/fieldHash.js';

describe('candidate uniqueness helpers', () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeAll(() => {
    process.env.ENCRYPTION_KEY =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = originalKey;
  });

  it('normalizes email to lowercase', () => {
    expect(normalizeCandidateEmail('  Test@Mail.COM ')).toBe('test@mail.com');
  });

  it('normalizes phone to 10 digits', () => {
    expect(normalizeCandidatePhone('98-7654-3210')).toBe('9876543210');
  });

  it('produces stable PAN hashes for same PAN different casing', () => {
    const a = hashPanForLookup('abcde1234f');
    const b = hashPanForLookup('ABCDE1234F');
    expect(a).toBe(b);
  });

  it('produces different PAN hashes for different PANs', () => {
    expect(hashPanForLookup('ABCDE1234F')).not.toBe(hashPanForLookup('ABCDE1234G'));
  });

  it('builds failed verification rows for duplicate identity', () => {
    const rows = buildDuplicateVerificationFailure(
      ['aadhaar', 'pan'],
      'candidate-id',
      { field: 'email', message: 'A candidate with this email already exists' }
    );
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.verificationStatus === 'failed')).toBe(true);
    expect(rows[0].responsePayload.message).toContain('email');
  });
});
