import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
export declare const getCandidates: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createCandidate: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCandidateById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateCandidate: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteCandidate: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=candidate.controller.d.ts.map