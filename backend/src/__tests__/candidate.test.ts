import request from 'supertest';
import express from 'express';
import { createCandidate, getCandidateById, updateCandidate, deleteCandidate } from '../controllers/candidate.controller.js';
import prisma from '../config/database.js';

jest.mock('../config/database.js');

const app = express();
app.use(express.json());

// Mock middleware for auth
app.use((req: any, res, next) => {
  req.user = { userId: 'test-user-id', role: 'user' };
  next();
});

app.post('/api/candidates', createCandidate);
app.get('/api/candidates/:id', getCandidateById);
app.put('/api/candidates/:id', updateCandidate);
app.delete('/api/candidates/:id', deleteCandidate);

describe('Candidate Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/candidates', () => {
    it('should create a new candidate with valid data', async () => {
      const candidateData = {
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        phone: '9876543210',
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        dob: '1990-01-15',
        address: '123 Main Street, City, State 12345',
      };

      (prisma.candidate.create as jest.Mock).mockResolvedValue({
        id: 'cand-123',
        ...candidateData,
        createdAt: new Date(),
        status: 'pending',
      });

      const response = await request(app)
        .post('/api/candidates')
        .send(candidateData);

      expect(response.status).toBe(201);
      expect(response.body.candidate.fullName).toBe(candidateData.fullName);
      expect(response.body.candidate.email).toMatch(/a\*\*\*c@test\.com/);
    });

    it('should reject candidate creation with invalid Aadhaar', async () => {
      const candidateData = {
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        phone: '9876543210',
        aadhaarNumber: '12345678901', // 11 digits instead of 12
        panNumber: 'ABCDE1234F',
        dob: '1990-01-15',
        address: '123 Main Street, City, State 12345',
      };

      const response = await request(app)
        .post('/api/candidates')
        .send(candidateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Aadhaar');
    });

    it('should reject candidate creation with invalid PAN', async () => {
      const candidateData = {
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        phone: '9876543210',
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234', // Missing last letter
        dob: '1990-01-15',
        address: '123 Main Street, City, State 12345',
      };

      const response = await request(app)
        .post('/api/candidates')
        .send(candidateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('PAN');
    });

    it('should reject candidate creation with invalid phone', async () => {
      const candidateData = {
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        phone: '987654321', // 9 digits instead of 10
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        dob: '1990-01-15',
        address: '123 Main Street, City, State 12345',
      };

      const response = await request(app)
        .post('/api/candidates')
        .send(candidateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Phone');
    });

    it('should reject candidate creation with invalid email', async () => {
      const candidateData = {
        fullName: 'Ravichandra Shinde',
        email: 'invalid-email',
        phone: '9876543210',
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        dob: '1990-01-15',
        address: '123 Main Street, City, State 12345',
      };

      const response = await request(app)
        .post('/api/candidates')
        .send(candidateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Email');
    });

    it('should reject candidate creation with short address', async () => {
      const candidateData = {
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        phone: '9876543210',
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        dob: '1990-01-15',
        address: 'Short', // Less than 10 characters
      };

      const response = await request(app)
        .post('/api/candidates')
        .send(candidateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Address');
    });
  });

  describe('GET /api/candidates/:id', () => {
    it('should retrieve candidate by ID with masked sensitive data', async () => {
      (prisma.candidate.findUnique as jest.Mock).mockResolvedValue({
        id: 'cand-123',
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        phone: '9876543210',
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        dob: new Date('1990-01-15'),
        address: '123 Main Street, City, State 12345',
        status: 'pending',
        createdAt: new Date(),
        verificationLogs: [],
      });

      const response = await request(app)
        .get('/api/candidates/cand-123');

      expect(response.status).toBe(200);
      expect(response.body.candidate.email).toMatch(/r\*\*\*a@test\.com/);
      expect(response.body.candidate.phone).toMatch(/XXXXXX3210/);
    });

    it('should return 404 for non-existent candidate', async () => {
      (prisma.candidate.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/candidates/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /api/candidates/:id', () => {
    it('should update candidate with valid data', async () => {
      const updateData = {
        fullName: 'Updated Name',
        address: 'New Address, City, State 12345',
      };

      (prisma.candidate.update as jest.Mock).mockResolvedValue({
        id: 'cand-123',
        fullName: updateData.fullName,
        email: 'ravichandra@test.com',
        phone: '9876543210',
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        dob: new Date('1990-01-15'),
        address: updateData.address,
        status: 'pending',
        createdAt: new Date(),
      });

      const response = await request(app)
        .put('/api/candidates/cand-123')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.candidate.fullName).toBe(updateData.fullName);
    });
  });

  describe('DELETE /api/candidates/:id', () => {
    it('should delete candidate successfully', async () => {
      (prisma.candidate.delete as jest.Mock).mockResolvedValue({
        id: 'cand-123',
      });

      const response = await request(app)
        .delete('/api/candidates/cand-123');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');
    });

    it('should return 404 when deleting non-existent candidate', async () => {
      (prisma.candidate.delete as jest.Mock).mockRejectedValue(
        new Error('Not found')
      );

      const response = await request(app)
        .delete('/api/candidates/non-existent');

      expect(response.status).toBe(500);
    });
  });
});
