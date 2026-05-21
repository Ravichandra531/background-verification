import request from 'supertest';
import express from 'express';
import { generateReport } from '../controllers/report.controller.js';
import prisma from '../config/database.js';

jest.mock('../config/database.js');

const app = express();
app.use(express.json());

// Mock middleware for auth
app.use((req: any, res, next) => {
  req.user = { userId: 'test-user-id', role: 'user' };
  next();
});

app.get('/api/reports/:candidateId', generateReport);

describe('Report Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports/:candidateId', () => {
    it('should generate report for candidate with verifications', async () => {
      const mockCandidate = {
        id: 'cand-123',
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        status: 'verified',
        verificationLogs: [
          {
            id: 'log-1',
            verificationType: 'aadhaar',
            verificationStatus: 'completed',
            verifiedAt: new Date('2026-05-20T10:00:00Z'),
          },
          {
            id: 'log-2',
            verificationType: 'pan',
            verificationStatus: 'completed',
            verifiedAt: new Date('2026-05-20T10:05:00Z'),
          },
        ],
      };

      (prisma.candidate.findUnique as jest.Mock).mockResolvedValue(mockCandidate);

      const response = await request(app)
        .get('/api/reports/cand-123');

      expect(response.status).toBe(200);
      expect(response.body.report).toBeDefined();
      expect(response.body.report.candidateInfo.fullName).toBe(mockCandidate.fullName);
      expect(response.body.report.verifications).toHaveLength(2);
      expect(response.body.report.verificationStatus).toBe('verified');
    });

    it('should generate report for candidate with partial verification', async () => {
      const mockCandidate = {
        id: 'cand-123',
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        status: 'partial',
        verificationLogs: [
          {
            id: 'log-1',
            verificationType: 'aadhaar',
            verificationStatus: 'completed',
            verifiedAt: new Date('2026-05-20T10:00:00Z'),
          },
          {
            id: 'log-2',
            verificationType: 'pan',
            verificationStatus: 'failed',
            verifiedAt: new Date('2026-05-20T10:05:00Z'),
          },
        ],
      };

      (prisma.candidate.findUnique as jest.Mock).mockResolvedValue(mockCandidate);

      const response = await request(app)
        .get('/api/reports/cand-123');

      expect(response.status).toBe(200);
      expect(response.body.report.verificationStatus).toBe('partial');
    });

    it('should generate report for candidate with no verifications', async () => {
      const mockCandidate = {
        id: 'cand-123',
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        status: 'pending',
        verificationLogs: [],
      };

      (prisma.candidate.findUnique as jest.Mock).mockResolvedValue(mockCandidate);

      const response = await request(app)
        .get('/api/reports/cand-123');

      expect(response.status).toBe(200);
      expect(response.body.report.verifications).toHaveLength(0);
      expect(response.body.report.verificationStatus).toBe('pending');
    });

    it('should return 404 for non-existent candidate', async () => {
      (prisma.candidate.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/reports/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should include generated timestamp in report', async () => {
      const mockCandidate = {
        id: 'cand-123',
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        status: 'verified',
        verificationLogs: [],
      };

      (prisma.candidate.findUnique as jest.Mock).mockResolvedValue(mockCandidate);

      const response = await request(app)
        .get('/api/reports/cand-123');

      expect(response.status).toBe(200);
      expect(response.body.report.generatedAt).toBeDefined();
      expect(new Date(response.body.report.generatedAt)).toBeInstanceOf(Date);
    });

    it('should include verified by information in report', async () => {
      const mockCandidate = {
        id: 'cand-123',
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        status: 'verified',
        verificationLogs: [],
      };

      (prisma.candidate.findUnique as jest.Mock).mockResolvedValue(mockCandidate);

      const response = await request(app)
        .get('/api/reports/cand-123');

      expect(response.status).toBe(200);
      expect(response.body.report.verifiedBy).toBeDefined();
      expect(response.body.report.verifiedByEmail).toBeDefined();
    });
  });
});
