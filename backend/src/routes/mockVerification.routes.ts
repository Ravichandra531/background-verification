import express from 'express';
import { verifyAadhaar, verifyPAN } from '../controllers/mockVerification.controller.js';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';

const router = express.Router();

const aadhaarSchema = z.object({
  body: z.object({
    aadhaarNumber: z.string()
      .regex(/^[0-9]{12}$/, 'Aadhaar must be 12 numeric digits')
      .trim(),
  }),
});

const panSchema = z.object({
  body: z.object({
    panNumber: z.string()
      .trim()
      .transform((val) => val.toUpperCase())
      .pipe(z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN must be in format: ABCDE1234F')),
  }),
});

router.post('/aadhaar/verify', validate(aadhaarSchema), verifyAadhaar);
router.post('/pan/verify', validate(panSchema), verifyPAN);

export default router;
