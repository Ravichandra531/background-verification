import { Prisma } from '@prisma/client';
import prisma from '../config/database.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { maskAadhaar, maskPan, maskEmail, maskPhone } from '../utils/masking.js';
import { normalizePan } from '../utils/documentValidation.js';
import { hashPanForLookup } from '../utils/fieldHash.js';
import { findCandidateFieldConflict, normalizeCandidateEmail, normalizeCandidatePhone, } from '../utils/candidateUniqueness.js';
const conflictResponse = (res, conflict) => {
    res.status(409).json({ error: conflict.message, field: conflict.field });
};
const handlePrismaUniqueError = (err, res) => {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = Array.isArray(err.meta?.target)
            ? err.meta.target[0]
            : String(err.meta?.target ?? 'field');
        const messages = {
            email: 'A candidate with this email already exists',
            phone: 'A candidate with this phone number already exists',
            panHash: 'A candidate with this PAN already exists',
        };
        res.status(409).json({
            error: messages[target] ?? 'A candidate with these details already exists',
            field: target === 'panHash' ? 'panNumber' : target,
        });
        return true;
    }
    return false;
};
export const getCandidates = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = {
            createdById: req.user?.userId,
            ...(status && { status }),
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                ],
            }),
        };
        const [candidates, total] = await Promise.all([
            prisma.candidate.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    status: true,
                    createdAt: true,
                },
            }),
            prisma.candidate.count({ where }),
        ]);
        const list = candidates.map((c) => ({
            ...c,
            email: maskEmail(c.email),
            phone: maskPhone(c.phone),
        }));
        res.status(200).json({
            candidates: list,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (err) {
        console.error('Get candidates error:', err instanceof Error ? err.message : err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const createCandidate = async (req, res) => {
    try {
        const { fullName, email, phone, aadhaarNumber, panNumber, dob, address } = req.body;
        const normalizedEmail = normalizeCandidateEmail(email);
        const normalizedPhone = normalizeCandidatePhone(phone);
        const normalizedPan = normalizePan(panNumber);
        const conflict = await findCandidateFieldConflict({
            email: normalizedEmail,
            phone: normalizedPhone,
            panNumber: normalizedPan,
            aadhaarNumber: aadhaarNumber,
        });
        if (conflict) {
            conflictResponse(res, conflict);
            return;
        }
        const candidate = await prisma.candidate.create({
            data: {
                fullName,
                email: normalizedEmail,
                phone: normalizedPhone,
                aadhaarNumber: encrypt(aadhaarNumber),
                panNumber: encrypt(normalizedPan),
                panHash: hashPanForLookup(normalizedPan),
                dob: new Date(dob),
                address,
                status: 'pending',
                createdById: req.user?.userId || '',
            },
        });
        res.status(201).json({
            message: 'Candidate created successfully',
            candidate: {
                id: candidate.id,
                fullName: candidate.fullName,
                email: maskEmail(normalizedEmail),
                phone: maskPhone(normalizedPhone),
                aadhaarNumber: maskAadhaar(aadhaarNumber),
                panNumber: maskPan(normalizedPan),
                dob: candidate.dob,
                address: candidate.address,
                status: candidate.status,
                createdAt: candidate.createdAt,
            },
        });
    }
    catch (err) {
        if (handlePrismaUniqueError(err, res))
            return;
        console.error('Create candidate error:', err instanceof Error ? err.message : err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const getCandidateById = async (req, res) => {
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
        const aadhaar = decrypt(candidate.aadhaarNumber);
        const pan = decrypt(candidate.panNumber);
        res.status(200).json({
            candidate: {
                id: candidate.id,
                fullName: candidate.fullName,
                email: maskEmail(candidate.email),
                phone: maskPhone(candidate.phone),
                aadhaarNumber: maskAadhaar(aadhaar),
                panNumber: maskPan(pan),
                dob: candidate.dob,
                address: candidate.address,
                status: candidate.status,
                createdAt: candidate.createdAt,
                verificationLogs: candidate.verificationLogs,
            },
        });
    }
    catch (err) {
        console.error('Get candidate error:', err instanceof Error ? err.message : err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, phone, aadhaarNumber, panNumber, dob, address, status } = req.body;
        const exist = await prisma.candidate.findFirst({
            where: {
                id,
                createdById: req.user?.userId,
            },
        });
        if (!exist) {
            res.status(404).json({ error: 'Candidate not found' });
            return;
        }
        const normalizedEmail = email ? normalizeCandidateEmail(email) : undefined;
        const normalizedPhone = phone ? normalizeCandidatePhone(phone) : undefined;
        const normalizedPan = panNumber ? normalizePan(panNumber) : undefined;
        const conflict = await findCandidateFieldConflict({
            email: normalizedEmail,
            phone: normalizedPhone,
            panNumber: normalizedPan,
            aadhaarNumber,
        }, id);
        if (conflict) {
            conflictResponse(res, conflict);
            return;
        }
        const data = {
            ...(fullName && { fullName }),
            ...(normalizedEmail && { email: normalizedEmail }),
            ...(normalizedPhone && { phone: normalizedPhone }),
            ...(aadhaarNumber && { aadhaarNumber: encrypt(aadhaarNumber) }),
            ...(normalizedPan && {
                panNumber: encrypt(normalizedPan),
                panHash: hashPanForLookup(normalizedPan),
            }),
            ...(dob && { dob: new Date(dob) }),
            ...(address && { address }),
            ...(status && { status }),
        };
        const candidate = await prisma.candidate.update({
            where: { id },
            data,
        });
        const aadhaar = decrypt(candidate.aadhaarNumber);
        const pan = decrypt(candidate.panNumber);
        res.status(200).json({
            message: 'Candidate updated successfully',
            candidate: {
                id: candidate.id,
                fullName: candidate.fullName,
                email: maskEmail(candidate.email),
                phone: maskPhone(candidate.phone),
                aadhaarNumber: maskAadhaar(aadhaar),
                panNumber: maskPan(pan),
                dob: candidate.dob,
                address: candidate.address,
                status: candidate.status,
                createdAt: candidate.createdAt,
            },
        });
    }
    catch (err) {
        if (handlePrismaUniqueError(err, res))
            return;
        console.error('Update candidate error:', err instanceof Error ? err.message : err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const deleteCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const candidate = await prisma.candidate.findFirst({
            where: {
                id,
                createdById: req.user?.userId,
            },
        });
        if (!candidate) {
            res.status(404).json({ error: 'Candidate not found' });
            return;
        }
        await prisma.candidate.delete({
            where: { id },
        });
        res.status(200).json({
            message: 'Candidate deleted successfully',
        });
    }
    catch (err) {
        console.error('Delete candidate error:', err instanceof Error ? err.message : err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=candidate.controller.js.map