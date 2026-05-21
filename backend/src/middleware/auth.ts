import { Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt.js';
import { AuthRequest } from '../types/index.js';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = header.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = decoded;
  next();
};
