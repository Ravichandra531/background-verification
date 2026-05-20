import { Router, Request, Response } from 'express';
import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = Router();
const startTime = Date.now();

router.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    service: 'verifybgc-api',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.get('/ready', async (_req: Request, res: Response): Promise<void> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/metrics', (_req: Request, res: Response): void => {
  const memory = process.memoryUsage();
  res.status(200).json({
    service: 'verifybgc-api',
    startedAt: new Date(startTime).toISOString(),
    uptimeSeconds: process.uptime(),
    memory: {
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external,
    },
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
});

export default router;
