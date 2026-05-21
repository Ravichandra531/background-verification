import express from 'express';
import { 
  getCandidates, 
  createCandidate, 
  getCandidateById,
  updateCandidate,
  deleteCandidate 
} from '../controllers/candidate.controller.js';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const createSchema = z.object({
  body: z.object({
    fullName: z.string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters')
      .trim(),
    email: z.string()
      .email('Invalid email format')
      .trim()
      .toLowerCase(),
    phone: z.string()
      .regex(/^[0-9]{10}$/, 'Phone must be a valid 10-digit number')
      .trim(),
    aadhaarNumber: z.string()
      .regex(/^[0-9]{12}$/, 'Aadhaar must be a valid 12-digit number')
      .trim(),
    panNumber: z.string()
      .trim()
      .transform((val) => val.toUpperCase())
      .pipe(z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN must be in valid format (e.g., ABCDE1234F)')),
    dob: z.string()
      .datetime({ message: 'Date of birth must be a valid date' })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')),
    address: z.string()
      .min(10, 'Address must be at least 10 characters')
      .max(500, 'Address must not exceed 500 characters')
      .trim(),
  }),
});

const idSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid candidate ID format'),
  }),
});

router.use(authenticate);

router.get('/', getCandidates);
router.post('/', validate(createSchema), createCandidate);
router.get('/:id', validate(idSchema), getCandidateById);
router.put('/:id', validate(idSchema), updateCandidate);
router.delete('/:id', validate(idSchema), deleteCandidate);

export default router;
