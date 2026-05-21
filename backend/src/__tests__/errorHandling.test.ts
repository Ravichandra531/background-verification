import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());

// Test route that throws error
app.get('/api/test-error', (req, res) => {
  throw new Error('Test error');
});

// Test route that returns 500
app.get('/api/test-500', (req, res) => {
  res.status(500).json({ error: 'Internal server error' });
});

// Test route that returns 404
app.get('/api/test-404', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Test route that returns 400
app.get('/api/test-400', (req, res) => {
  res.status(400).json({ error: 'Bad request' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = 'status' in err ? (err.status as number) : 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

describe('API Error Handling', () => {
  describe('Error Status Codes', () => {
    it('should return 400 for bad request', async () => {
      const response = await request(app).get('/api/test-400');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad request');
    });

    it('should return 404 for not found', async () => {
      const response = await request(app).get('/api/test-404');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
    });

    it('should return 500 for server error', async () => {
      const response = await request(app).get('/api/test-500');
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('Error Response Format', () => {
    it('should return error in JSON format', async () => {
      const response = await request(app).get('/api/test-400');
      expect(response.type).toMatch(/json/);
      expect(response.body).toHaveProperty('error');
    });

    it('should include error message in response', async () => {
      const response = await request(app).get('/api/test-500');
      expect(response.body.error).toBeDefined();
      expect(typeof response.body.error).toBe('string');
    });
  });

  describe('Missing Endpoints', () => {
    it('should handle undefined routes gracefully', async () => {
      const response = await request(app).get('/api/undefined-route');
      expect(response.status).toBe(404);
    });
  });

  describe('Invalid Request Methods', () => {
    it('should handle invalid HTTP methods', async () => {
      const response = await request(app).post('/api/test-400');
      expect(response.status).toBe(404);
    });
  });

  describe('Malformed JSON', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/test-400')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      
      expect(response.status).toBe(400);
    });
  });
});
