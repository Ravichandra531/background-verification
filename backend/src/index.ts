import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.routes.js';
import candidateRoutes from './routes/candidate.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import reportRoutes from './routes/report.routes.js';
import mockVerificationRoutes from './routes/mockVerification.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(requestLogger);
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/mock-api', mockVerificationRoutes);

app.use((_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction): void => {
  logger.error('Unhandled error', {
    requestId: (req as Request & { requestId?: string }).requestId,
    error: err.message,
  });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development',
  });
});
