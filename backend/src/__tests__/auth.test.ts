import request from 'supertest';
import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import prisma from '../config/database.js';
import bcrypt from 'bcrypt';

jest.mock('../config/database.js');
jest.mock('bcrypt');

const app = express();
app.use(express.json());
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid credentials', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@test.com',
        password: 'SecurePass123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: '123',
        name: userData.name,
        email: userData.email,
        role: 'user',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.token).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@test.com',
        password: 'weak',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Password must be at least 8 characters');
    });

    it('should reject registration with missing uppercase letter', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@test.com',
        password: 'securepass123!',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('uppercase');
    });

    it('should reject registration with missing special character', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@test.com',
        password: 'SecurePass123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('special character');
    });

    it('should reject registration if user already exists', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@test.com',
        password: 'SecurePass123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        email: userData.email,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'john@test.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const userData = {
        email: 'john@test.com',
        password: 'SecurePass123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        name: 'John Doe',
        email: userData.email,
        passwordHash: 'hashed_password',
        role: 'user',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.token).toBeDefined();
    });

    it('should reject login with invalid email', async () => {
      const userData = {
        email: 'nonexistent@test.com',
        password: 'SecurePass123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const userData = {
        email: 'john@test.com',
        password: 'WrongPassword123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        name: 'John Doe',
        email: userData.email,
        passwordHash: 'hashed_password',
        role: 'user',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@test.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });
});
