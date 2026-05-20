import express from 'express';
import { downloadReport } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';

const router = express.Router();

const reportSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid candidate ID format'),
  }),
});

router.use(authenticate);

router.get('/:id', validate(reportSchema), downloadReport);

export default router;
