import { Response } from 'express';
import prisma from '../config/database.js';
import crypto from 'crypto';
import { AuthRequest } from '../types/index.js';

const ALG = 'aes-256-gcm';
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY must be defined in the environment variables');
}
const KEY_ENV = process.env.ENCRYPTION_KEY;
const IV_LEN = 16;

const getKey = (): Buffer => {
  const key = Buffer.from(KEY_ENV.slice(0, 64), 'hex');
  if (key.length !== 32) {
    throw new Error('Key must be 32 bytes');
  }
  return key;
};

const encrypt = (text: string | null): string | null => {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(IV_LEN);
    const cipher = crypto.createCipheriv(ALG, getKey(), iv);
    let enc = cipher.update(text, 'utf8', 'hex');
    enc += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + enc;
  } catch (err) {
    console.error('Encryption error:', err instanceof Error ? err.message : err);
    throw new Error('Failed to encrypt');
  }
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

const maskEmail = (email: string): string => {
  if (!email) return '';
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const masked = user[0] + '***' + (user.length > 1 ? user.slice(-1) : '');
  return `${masked}@${domain}`;
};

const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 4) return 'XXXXXXXXXX';
  return 'X'.repeat(phone.length - 4) + phone.slice(-4);
};

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

    const list = candidates.map(c => ({
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

    const encAadhaar = encrypt(aadhaarNumber);
    const encPan = encrypt(panNumber);

    const candidate = await prisma.candidate.create({
      data: {
        fullName,
        email,
        phone,
        aadhaarNumber: encAadhaar || '',
        panNumber: encPan || '',
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

    console.log(`Candidate deleted: ${id} by user: ${req.user?.userId}`);

    res.status(200).json({
      message: 'Candidate deleted successfully',
    });
  } catch (err) {
    console.error('Delete candidate error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
