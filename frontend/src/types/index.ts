export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: string;
  _count?: {
    candidates: number;
  };
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  aadhaarNumber: string; // masked
  panNumber: string; // masked
  dob: string;
  address: string;
  status: 'pending' | 'verified' | 'failed' | 'partial';
  createdAt: string;
  createdById?: string;
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
  requestPayload: any;
  responsePayload: any;
  verificationStatus: 'completed' | 'failed';
  verifiedAt: string;
}

export interface ReportData {
  candidateInfo: {
    fullName: string;
    email: string;
    phone: string;
    aadhaarNumber: string;
    panNumber: string;
    dob: string;
    address: string;
  };
  verificationStatus: 'pending' | 'verified' | 'failed' | 'partial';
  verifications: {
    type: 'aadhaar' | 'pan';
    status: 'completed' | 'failed';
    verifiedAt: string;
    details: any;
  }[];
  generatedAt: string;
  verifiedBy?: string;
  verifiedByEmail?: string;
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
