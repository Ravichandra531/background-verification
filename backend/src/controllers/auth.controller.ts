import { Request, Response } from 'express';
import prisma from '../config/database.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../config/jwt.js';

const SALT = 10;
const passRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

const publicUser = (user: { id: string; name: string; email: string; role: string }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };

    if (!passRe.test(password)) {
      res.status(400).json({
        error:
          'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.',
      });
      return;
    }

    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) {
      res.status(409).json({ error: 'User already exists with this email' });
      return;
    }

    const hash = await bcrypt.hash(password, SALT);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hash,
        role: 'user',
      },
    });

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({
      message: 'User registered successfully',
      user: publicUser(user),
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.status(200).json({
      message: 'Login successful',
      user: publicUser(user),
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
