import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface ReportData {
  candidateInfo: {
    candidateId: string;
    fullName: string;
    email: string;
    phone: string;
    aadhaarNumber: string;
    panNumber: string;
    dob: string;
    address: string;
  };
  verificationStatus: string;
  verifications: Array<{
    type: string;
    status: string;
    verifiedAt: Date;
  }>;
  generatedAt: Date;
  verifiedBy: string;
  verifiedByEmail?: string;
}
