export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  _count?: {
    candidates: number;
  };
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  aadhaarNumber: string;
  panNumber: string;
  dob: string;
  address: string;
  status: 'pending' | 'verified' | 'failed' | 'partial';
  createdAt: string;
  createdBy?: {
    name: string;
    email: string;
  };
  verificationLogs?: VerificationLog[];
}

export interface VerificationLog {
  id: string;
  candidateId: string;
  verificationType: 'aadhaar' | 'pan';
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  verificationStatus: 'completed' | 'failed';
  verifiedAt: string;
}

export interface AdminStats {
  users: {
    total: number;
  };
  candidates: {
    total: number;
    verified: number;
    pending: number;
    failed: number;
    partial: number;
  };
  verifications: {
    total: number;
  };
}
