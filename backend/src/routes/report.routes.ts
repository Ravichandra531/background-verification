import express from 'express';
import { downloadReport, downloadReportPDF } from '../controllers/report.controller.js';
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

// GET /api/reports/:id - JSON report
router.get('/:id', validate(reportSchema), downloadReport);

// GET /api/reports/:id/pdf - PDF report
router.get('/:id/pdf', validate(reportSchema), downloadReportPDF);

export default router;
