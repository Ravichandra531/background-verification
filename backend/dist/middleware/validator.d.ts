import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validator.d.ts.map