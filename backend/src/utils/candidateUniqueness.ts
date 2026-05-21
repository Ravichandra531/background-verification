import prisma from '../config/database.js';
import { decrypt } from './encryption.js';
import { hashPanForLookup } from './fieldHash.js';
import { normalizePan, stripAadhaarDigits } from './documentValidation.js';

export type UniqueField = 'email' | 'phone' | 'panNumber' | 'aadhaarNumber';

export function normalizeCandidateEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeCandidatePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 10);
}

export interface CandidateUniqueInput {
  email?: string;
  phone?: string;
  panNumber?: string;
  aadhaarNumber?: string;
}

async function findAadhaarConflict(
  aadhaarNumber: string,
  excludeId?: string
): Promise<boolean> {
  const target = stripAadhaarDigits(aadhaarNumber);
  const others = await prisma.candidate.findMany({
    where: excludeId ? { id: { not: excludeId } } : {},
    select: { aadhaarNumber: true },
  });
  for (const row of others) {
    const existing = decrypt(row.aadhaarNumber);
    if (existing && stripAadhaarDigits(existing) === target) {
      return true;
    }
  }
  return false;
}

export async function findCandidateFieldConflict(
  input: CandidateUniqueInput,
  excludeId?: string
): Promise<{ field: UniqueField; message: string } | null> {
  const notSelf = excludeId ? { id: { not: excludeId } } : {};

  if (input.email) {
    const email = normalizeCandidateEmail(input.email);
    const existing = await prisma.candidate.findFirst({
      where: { ...notSelf, email },
      select: { id: true },
    });
    if (existing) {
      return { field: 'email', message: 'A candidate with this email already exists' };
    }
  }

  if (input.phone) {
    const phone = normalizeCandidatePhone(input.phone);
    const existing = await prisma.candidate.findFirst({
      where: { ...notSelf, phone },
      select: { id: true },
    });
    if (existing) {
      return { field: 'phone', message: 'A candidate with this phone number already exists' };
    }
  }

  if (input.panNumber) {
    const panHash = hashPanForLookup(normalizePan(input.panNumber));
    const existing = await prisma.candidate.findFirst({
      where: { ...notSelf, panHash },
      select: { id: true },
    });
    if (existing) {
      return { field: 'panNumber', message: 'A candidate with this PAN already exists' };
    }

    // Legacy rows without panHash: compare decrypted PANs
    const legacyCandidates = await prisma.candidate.findMany({
      where: { ...notSelf, panHash: null },
      select: { id: true, panNumber: true },
    });
    const targetPan = normalizePan(input.panNumber);
    for (const row of legacyCandidates) {
      const existingPan = decrypt(row.panNumber);
      if (existingPan && normalizePan(existingPan) === targetPan) {
        return { field: 'panNumber', message: 'A candidate with this PAN already exists' };
      }
    }
  }

  if (input.aadhaarNumber) {
    const duplicate = await findAadhaarConflict(input.aadhaarNumber, excludeId);
    if (duplicate) {
      return {
        field: 'aadhaarNumber',
        message: 'A candidate with this Aadhaar number already exists',
      };
    }
  }

  return null;
}

/** Build failed verification results when identity fields duplicate another candidate. */
export function buildDuplicateVerificationFailure(
  types: Array<'aadhaar' | 'pan'>,
  candidateId: string,
  conflict: { field: UniqueField; message: string }
): Array<{
  type: 'aadhaar' | 'pan';
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  verificationStatus: 'failed';
}> {
  return types.map((type) => ({
    type,
    requestPayload: {
      candidateId,
      verificationType: type,
      timestamp: new Date().toISOString(),
      duplicateField: conflict.field,
    },
    responsePayload: {
      status: 'failed',
      message: conflict.message,
    },
    verificationStatus: 'failed' as const,
  }));
}
