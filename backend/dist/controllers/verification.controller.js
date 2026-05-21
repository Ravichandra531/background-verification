import prisma from '../config/database.js';
import { decrypt } from '../utils/encryption.js';
import { isValidAadhaar, isValidPan, normalizePan, } from '../utils/documentValidation.js';
import { computeCandidateStatus } from '../utils/verificationStatus.js';
import { findCandidateFieldConflict, buildDuplicateVerificationFailure, normalizeCandidateEmail, normalizeCandidatePhone, } from '../utils/candidateUniqueness.js';
const sanitize = (data = {}) => {
    const sensitive = new Set([
        'password',
        'passwordHash',
        'aadhaarNumber',
        'panNumber',
        'token',
        'accessToken',
        'refreshToken',
    ]);
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, sensitive.has(k) ? '[REDACTED]' : v]));
};
const getApiUrl = () => process.env.API_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
const handlers = {
    aadhaar: async (num) => {
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
        const data = (await res.json());
        if (!res.ok) {
            return {
                status: 'failed',
                message: data.error || data.message || 'Aadhaar verification failed',
            };
        }
        return data;
    },
    pan: async (num) => {
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
        const data = (await res.json());
        if (!res.ok) {
            return {
                status: 'failed',
                message: data.error || data.message || 'PAN verification failed',
            };
        }
        return data;
    },
};
const mapApiResultToLogStatus = (result) => result.status === 'verified' ? 'completed' : 'failed';
const runVerify = async ({ type, candidateId, aadhaar, pan }) => {
    try {
        // Check for PAN duplicate when verifying Aadhaar
        if (type === 'aadhaar' && pan) {
            const panConflict = await findCandidateFieldConflict({ panNumber: pan }, candidateId);
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
        const result = type === 'aadhaar'
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
    }
    catch {
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
function resolveTypes(verificationType) {
    if (verificationType === 'all')
        return ['aadhaar', 'pan'];
    if (verificationType === 'aadhaar' || verificationType === 'pan') {
        return [verificationType];
    }
    return [];
}
export const start = async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationType } = req.body;
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
        const duplicateConflict = await findCandidateFieldConflict({
            email: normalizeCandidateEmail(candidate.email),
            phone: normalizeCandidatePhone(candidate.phone),
        }, id);
        const results = duplicateConflict
            ? buildDuplicateVerificationFailure(types, id, duplicateConflict)
            : await Promise.all(types.map((type) => runVerify({
                type,
                candidateId: id,
                aadhaar,
                pan,
            })));
        await prisma.verificationLog.createMany({
            data: results.map((v) => ({
                candidateId: id,
                verificationType: v.type,
                requestPayload: sanitize(v.requestPayload),
                responsePayload: sanitize(v.responsePayload),
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
                message: typeof v.responsePayload.message === 'string'
                    ? v.responsePayload.message
                    : undefined,
            })),
            summary: {
                total: results.length,
                completed: results.filter((v) => v.verificationStatus === 'completed').length,
                failed: results.filter((v) => v.verificationStatus === 'failed').length,
            },
        });
    }
    catch (err) {
        console.error('Start verification error:', err instanceof Error ? err.message : err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const getStatus = async (req, res) => {
    try {
        const { id } = req.params;
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
        const completed = candidate.verificationLogs.filter((log) => log.verificationStatus === 'completed').length;
        const failed = candidate.verificationLogs.filter((log) => log.verificationStatus === 'failed').length;
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
    }
    catch (err) {
        console.error('Get verification status error:', err instanceof Error ? err.message : err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=verification.controller.js.map