import express from 'express';
import { start, getStatus } from '../controllers/verification.controller.js';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
const startSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid candidate ID format'),
    }),
    body: z.object({
        verificationType: z.enum(['aadhaar', 'pan', 'all'], { errorMap: () => ({ message: 'Invalid verification type' }) }),
    }),
});
const statusSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid candidate ID format'),
    }),
});
router.use(authenticate);
router.post('/:id/start', validate(startSchema), start);
router.get('/:id/status', validate(statusSchema), getStatus);
export default router;
//# sourceMappingURL=verification.routes.js.map