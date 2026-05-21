import request from 'supertest';
import express from 'express';
import { downloadReport } from '../controllers/report.controller.js';

const app = express();
app.use(express.json());

// Mock middleware for auth
app.use((req: any, _res, next) => {
  req.user = { userId: 'test-user-id', role: 'user' };
  next();
});

app.get('/api/reports/:candidateId', downloadReport);

describe('Report Controller', () => {
  describe('GET /api/reports/:candidateId', () => {
    it('should return 404 for non-existent candidate', async () => {
      const response = await request(app)
        .get('/api/reports/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should return error for invalid candidate ID format', async () => {
      const response = await request(app)
        .get('/api/reports/');

      expect(response.status).toBe(404);
    });
  });
});
