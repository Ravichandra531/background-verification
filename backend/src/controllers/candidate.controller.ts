import { Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest } from '../types/index.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { maskAadhaar, maskPan, maskEmail, maskPhone } from '../utils/masking.js';

export const getCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, search } = req.query as { page?: string; limit?: string; status?: string; search?: string };
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {
      createdById: req.user?.userId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
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
  } catch (err) {
    console.error('Get candidates error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, email, phone, aadhaarNumber, panNumber, dob, address } = req.body as {
      fullName: string;
      email: string;
      phone: string;
      aadhaarNumber: string;
      panNumber: string;
      dob: string;
      address: string;
    };

    const candidate = await prisma.candidate.create({
      data: {
        fullName,
        email,
        phone,
        aadhaarNumber: encrypt(aadhaarNumber),
        panNumber: encrypt(panNumber),
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
        email: maskEmail(email),
        phone: maskPhone(phone),
        aadhaarNumber: maskAadhaar(aadhaarNumber),
        panNumber: maskPan(panNumber),
        dob: candidate.dob,
        address: candidate.address,
        status: candidate.status,
        createdAt: candidate.createdAt,
      },
    });
  } catch (err) {
    console.error('Create candidate error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCandidateById = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (err) {
    console.error('Get candidate error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { fullName, email, phone, aadhaarNumber, panNumber, dob, address, status } = req.body as {
      fullName?: string;
      email?: string;
      phone?: string;
      aadhaarNumber?: string;
      panNumber?: string;
      dob?: string;
      address?: string;
      status?: string;
    };

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

    const data: Record<string, unknown> = {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(aadhaarNumber && { aadhaarNumber: encrypt(aadhaarNumber) }),
      ...(panNumber && { panNumber: encrypt(panNumber) }),
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
  } catch (err) {
    console.error('Update candidate error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

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
  } catch (err) {
    console.error('Delete candidate error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
