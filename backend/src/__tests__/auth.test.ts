import request from 'supertest';
import express from 'express';
import { register, login } from '../controllers/auth.controller.js';

const app = express();
app.use(express.json());
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
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

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'john@test.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Password must be at least 8');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@test.com' });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });
  });
});
