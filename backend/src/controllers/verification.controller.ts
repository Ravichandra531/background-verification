import { Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest } from '../types/index.js';
import { decrypt } from '../utils/encryption.js';
import {
  isValidAadhaar,
  isValidPan,
  normalizePan,
} from '../utils/documentValidation.js';
import { computeCandidateStatus } from '../utils/verificationStatus.js';
import {
  findCandidateFieldConflict,
  buildDuplicateVerificationFailure,
  normalizeCandidateEmail,
  normalizeCandidatePhone,
} from '../utils/candidateUniqueness.js';

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
    Object.entries(data).map(([k, v]) => [k, sensitive.has(k) ? '[REDACTED]' : v])
  );
};

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
    if (!isValidAadhaar(num)) {
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
    const normalized = normalizePan(num);
    if (!isValidPan(normalized)) {
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

type VerifyType = 'aadhaar' | 'pan';

interface RunParams {
  type: VerifyType;
  candidateId: string;
  aadhaar: string | null;
  pan: string | null;
}

interface VerifyOut {
  type: VerifyType;
  requestPayload: Record<string, unknown>;
  responsePayload: VerifyResult;
  verificationStatus: 'completed' | 'failed';
}

const mapApiResultToLogStatus = (result: VerifyResult): 'completed' | 'failed' =>
  result.status === 'verified' ? 'completed' : 'failed';

const runVerify = async ({ type, candidateId, aadhaar, pan }: RunParams): Promise<VerifyOut> => {
  try {
    // Check for duplicates when verifying
    if (type === 'aadhaar' && aadhaar) {
      const aadhaarConflict = await findCandidateFieldConflict(
        { aadhaarNumber: aadhaar },
        candidateId
      );
      
      if (aadhaarConflict && aadhaarConflict.field === 'aadhaarNumber') {
        return {
          type,
          requestPayload: {
            candidateId,
            verificationType: type,
            timestamp: new Date().toISOString(),
            duplicateField: 'aadhaarNumber',
          },
          responsePayload: {
            status: 'failed',
            message: aadhaarConflict.message,
          },
          verificationStatus: 'failed',
        };
      }
    }

    if (type === 'pan' && pan) {
      const panConflict = await findCandidateFieldConflict(
        { panNumber: pan },
        candidateId
      );
      
      if (panConflict && panConflict.field === 'panNumber') {
        return {
          type,
          requestPayload: {
            candidateId,
            verificationType: type,
            timestamp: new Date().toISOString(),
            duplicateField: 'panNumber',
          },
          responsePayload: {
            status: 'failed',
            message: panConflict.message,
          },
          verificationStatus: 'failed',
        };
      }
    }

    const result =
      type === 'aadhaar'
        ? await handlers.aadhaar(aadhaar || '')
        : await handlers.pan(pan || '');

    return {
      type,
      requestPayload: {
        candidateId,
        verificationType: type,
        timestamp: new Date().toISOString(),
      },
      responsePayload: result,
      verificationStatus: mapApiResultToLogStatus(result),
    };
  } catch {
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

function resolveTypes(verificationType: string): VerifyType[] {
  if (verificationType === 'all') return ['aadhaar', 'pan'];
  if (verificationType === 'aadhaar' || verificationType === 'pan') {
    return [verificationType];
  }
  return [];
}

export const start = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { verificationType } = req.body as { verificationType: string };

    const types = resolveTypes(verificationType);
    if (!types.length) {
      res.status(400).json({ error: 'Invalid verification type' });
      return;
    }

    const candidate = await prisma.candidate.findFirst({
      where: {
        id,
        createdById: req.user?.userId,
      },
      select: {
        id: true,
        email: true,
        phone: true,
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

    if (types.includes('aadhaar') && !isValidAadhaar(aadhaar)) {
      res.status(400).json({
        error: 'Candidate Aadhaar is missing or invalid. Update the record before verifying.',
      });
      return;
    }

    if (types.includes('pan') && !isValidPan(pan)) {
      res.status(400).json({
        error: 'Candidate PAN is missing or invalid. Update the record before verifying.',
      });
      return;
    }

    const duplicateConflict = await findCandidateFieldConflict(
      {
        email: normalizeCandidateEmail(candidate.email),
        phone: normalizeCandidatePhone(candidate.phone),
      },
      id
    );

    const results = duplicateConflict
      ? buildDuplicateVerificationFailure(types, id, duplicateConflict)
      : await Promise.all(
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
        requestPayload: sanitize(v.requestPayload) as object,
        responsePayload: sanitize(v.responsePayload) as object,
        verificationStatus: v.verificationStatus,
      })),
    });

    const allLogs = await prisma.verificationLog.findMany({
      where: { candidateId: id },
      select: {
        verificationType: true,
        verificationStatus: true,
        verifiedAt: true,
      },
    });

    const status = computeCandidateStatus(allLogs);

    await prisma.candidate.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({
      message: duplicateConflict
        ? 'Verification failed: duplicate identity on another candidate'
        : 'Verification process completed',
      duplicateConflict: duplicateConflict
        ? { field: duplicateConflict.field, error: duplicateConflict.message }
        : undefined,
      overallStatus: status,
      verifications: results.map((v) => ({
        type: v.type,
        status: v.verificationStatus,
        message:
          typeof v.responsePayload.message === 'string'
            ? v.responsePayload.message
            : undefined,
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
