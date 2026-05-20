import { Response } from 'express';
import prisma from '../config/database.js';
import crypto from 'crypto';
import { AuthRequest } from '../types/index.js';

const ALG = 'aes-256-gcm';
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY must be defined in the environment variables');
}
const KEY_ENV = process.env.ENCRYPTION_KEY;

const getKey = (): Buffer => {
  const key = Buffer.from(KEY_ENV.slice(0, 64), 'hex');
  if (key.length !== 32) {
    throw new Error('Key must be 32 bytes');
  }
  return key;
};

const decrypt = (text: string | null): string | null => {
  if (!text) return null;
  try {
    const parts = text.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const enc = parts[2];
    const decipher = crypto.createDecipheriv(ALG, getKey(), iv);
    decipher.setAuthTag(tag);
    let dec = decipher.update(enc, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch (err) {
    console.error('Decryption error:', err instanceof Error ? err.message : err);
    throw new Error('Failed to decrypt');
  }
};

const maskAadhaar = (val: string | null): string => {
  if (!val || val.length !== 12) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${val.slice(-4)}`;
};

const maskPan = (val: string | null): string => {
  if (!val || val.length !== 10) return 'XXXXXXXXXX';
  return `XXXXX${val.slice(5, 9)}X`;
};

export const downloadReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const candidate = await prisma.candidate.findFirst({
      where: {
        id,
        createdById: req.user?.userId,
      },
      include: {
        verificationLogs: {
          orderBy: { verifiedAt: 'desc' },
        },
      },
    });

    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    const aadhaar = decrypt(candidate.aadhaarNumber);
    const pan = decrypt(candidate.panNumber);

    const verifier = req.user?.userId
      ? await prisma.user.findUnique({
          where: { id: req.user.userId },
          select: { name: true, email: true },
        })
      : null;

    const report = {
      candidateInfo: {
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        aadhaarNumber: maskAadhaar(aadhaar),
        panNumber: maskPan(pan),
        dob: candidate.dob,
        address: candidate.address,
      },
      verificationStatus: candidate.status,
      verifications: candidate.verificationLogs.map(log => ({
        type: log.verificationType,
        status: log.verificationStatus,
        verifiedAt: log.verifiedAt,
        details: log.responsePayload,
      })),
      generatedAt: new Date().toISOString(),
      verifiedBy: verifier?.name || verifier?.email || req.user?.email || 'Unknown',
      verifiedByEmail: verifier?.email || req.user?.email,
    };

    res.status(200).json({
      message: 'Report generated successfully',
      report,
    });
  } catch (err) {
    console.error('Download report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
