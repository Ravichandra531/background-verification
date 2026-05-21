import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const requireRole: (...allowedRoles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=roleCheck.d.ts.map