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

const key = getKey();

export const decrypt = (text: string | null): string | null => {
  if (!text) return null;

  try {
    const [ivHex, tagHex, encrypted] = text.split(':');
    if (!ivHex || !tagHex || !encrypted) {
      throw new Error('Invalid format');
    }

    const decipher = crypto.createDecipheriv(ALG, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  } catch (err) {
    console.error('Decryption error:', err instanceof Error ? err.message : err);
    throw new Error('Failed to decrypt');
  }
};

const sanitize = (data: Record<string, unknown> = {}): Record<string, unknown> => {
  const sensitive = new Set([
    'password',
    'passwordHash',
    'aadhaarNumber',
    'panNumber',
    'token',
    'accessToken',
    'refreshToken',
  ]);

  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [
      k,
      sensitive.has(k) ? '[REDACTED]' : v,
    ])
  );
};

interface VerificationLog {
  verificationStatus: string;
}

const calcStatus = (logs: VerificationLog[] = []): string => {
  if (!logs.length) return 'pending';
  const list = logs.map((log) => log.verificationStatus);
  if (list.every((s) => s === 'completed')) return 'verified';
  if (list.every((s) => s === 'failed')) return 'failed';
  return 'partial';
};

const aadhaarRe = /^[0-9]{12}$/;
const panRe = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

interface VerifyResult {
  status: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

const getApiUrl = (): string =>
  process.env.API_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;

const handlers = {
  aadhaar: async (num: string): Promise<VerifyResult> => {
    if (!aadhaarRe.test(num)) {
      return {
        status: 'failed',
        message: 'Invalid Aadhaar format. Must be exactly 12 numeric digits.',
      };
    }

    const res = await fetch(`${getApiUrl()}/mock-api/aadhaar/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aadhaarNumber: num }),
    });

    const data = (await res.json()) as VerifyResult;
    if (!res.ok) {
      return {
        status: 'failed',
        message: data.error || data.message || 'Aadhaar verification failed',
      };
    }
    return data;
  },

  pan: async (num: string): Promise<VerifyResult> => {
    const normalized = num.toUpperCase();
    if (!panRe.test(normalized)) {
      return {
        status: 'failed',
        message: 'Invalid PAN format. Must match ABCDE1234F.',
      };
    }

    const res = await fetch(`${getApiUrl()}/mock-api/pan/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panNumber: normalized }),
    });

    const data = (await res.json()) as VerifyResult;
    if (!res.ok) {
      return {
        status: 'failed',
        message: data.error || data.message || 'PAN verification failed',
      };
    }
    return data;
  },
};

interface RunParams {
  type: string;
  candidateId: string;
  aadhaar: string | null;
  pan: string | null;
}

interface VerifyOut {
  type: string;
  requestPayload: Record<string, unknown>;
  responsePayload: VerifyResult;
  verificationStatus: string;
}

const runVerify = async ({
  type,
  candidateId,
  aadhaar,
  pan,
}: RunParams): Promise<VerifyOut> => {
  try {
    let result: VerifyResult;

    if (type === 'aadhaar') {
      result = await handlers.aadhaar(aadhaar || '');
    } else if (type === 'pan') {
      result = await handlers.pan((pan || '').toUpperCase());
    } else {
      result = {
        status: 'verified',
        message: `${type} verification completed`,
      };
    }

    return {
      type,
      requestPayload: {
        candidateId,
        verificationType: type,
        timestamp: new Date().toISOString(),
      },
      responsePayload: result,
      verificationStatus: result.status === 'verified' ? 'completed' : 'failed',
    };
  } catch (err) {
    return {
      type,
      requestPayload: {
        candidateId,
        verificationType: type,
        timestamp: new Date().toISOString(),
      },
      responsePayload: {
        status: 'failed',
        message: 'Verification service unavailable',
      },
      verificationStatus: 'failed',
    };
  }
};

export const start = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { verificationType } = req.body as { verificationType: string };

    const candidate = await prisma.candidate.findFirst({
      where: {
        id,
        createdById: req.user?.userId,
      },
      select: {
        id: true,
        aadhaarNumber: true,
        panNumber: true,
      },
    });

    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    const aadhaar = decrypt(candidate.aadhaarNumber);
    const pan = decrypt(candidate.panNumber);

    const types = verificationType === 'all' ? ['aadhaar', 'pan'] : [verificationType];

    const results = await Promise.all(
      types.map((type) =>
        runVerify({
          type,
          candidateId: id,
          aadhaar,
          pan,
        })
      )
    );

    await prisma.verificationLog.createMany({
      data: results.map((v) => ({
        candidateId: id,
        verificationType: v.type,
        requestPayload: v.requestPayload as any,
        responsePayload: v.responsePayload as any,
        verificationStatus: v.verificationStatus,
      })),
    });

    const status = calcStatus(results);

    await prisma.candidate.update({
      where: { id },
      data: { status },
    });

    console.log(
      'Verification completed:',
      sanitize({
        candidateId: id,
        types,
        status,
      })
    );

    res.status(200).json({
      message: 'Verification process completed',
      overallStatus: status,
      verifications: results.map((v) => ({
        type: v.type,
        status: v.verificationStatus,
      })),
      summary: {
        total: results.length,
        completed: results.filter((v) => v.verificationStatus === 'completed').length,
        failed: results.filter((v) => v.verificationStatus === 'failed').length,
      },
    });
  } catch (err) {
    console.error('Start verification error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStatus = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const completed = candidate.verificationLogs.filter(
      (log) => log.verificationStatus === 'completed'
    ).length;

    const failed = candidate.verificationLogs.filter(
      (log) => log.verificationStatus === 'failed'
    ).length;

    res.status(200).json({
      candidateId: id,
      overallStatus: candidate.status,
      verifications: candidate.verificationLogs.map((log) => ({
        type: log.verificationType,
        status: log.verificationStatus,
        verifiedAt: log.verifiedAt,
      })),
      summary: {
        total: candidate.verificationLogs.length,
        completed,
        failed,
      },
    });
  } catch (err) {
    console.error('Get verification status error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Internal server error' });
  }
};