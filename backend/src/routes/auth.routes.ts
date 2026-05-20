import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .trim(),
    email: z.string()
      .email('Invalid email format')
      .trim()
      .toLowerCase(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Invalid email format')
      .trim()
      .toLowerCase(),
    password: z.string()
      .min(1, 'Password is required'),
  }),
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);

export default router;
