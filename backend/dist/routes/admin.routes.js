import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import prisma from '../config/database.js';
const router = express.Router();
router.use(authenticate);
router.use(requireRole('admin'));
router.get('/users', async (_req, res, _next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                _count: {
                    select: { candidates: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ users });
    }
    catch (err) {
        console.error('Get users error:', err instanceof Error ? err.message : err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/candidates', async (req, res, _next) => {
    try {
        const { page = '1', limit = '10', status } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = status ? { status } : {};
        const [candidates, total] = await Promise.all([
            prisma.candidate.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.candidate.count({ where }),
        ]);
        res.status(200).json({
            candidates,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (err) {
        console.error('Get all candidates error:', err instanceof Error ? err.message : err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/users/:id/role', async (req, res, _next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
            return;
        }
        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });
        res.status(200).json({
            message: 'User role updated successfully',
            user,
        });
    }
    catch (err) {
        console.error('Update user role error:', err instanceof Error ? err.message : err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/stats', async (_req, res, _next) => {
    try {
        const [users, candidates, verified, pending, failed, partial, verifications,] = await Promise.all([
            prisma.user.count(),
            prisma.candidate.count(),
            prisma.candidate.count({ where: { status: 'verified' } }),
            prisma.candidate.count({ where: { status: 'pending' } }),
            prisma.candidate.count({ where: { status: 'failed' } }),
            prisma.candidate.count({ where: { status: 'partial' } }),
            prisma.verificationLog.count(),
        ]);
        res.status(200).json({
            stats: {
                users: { total: users },
                candidates: {
                    total: candidates,
                    verified,
                    pending,
                    failed,
                    partial,
                },
                verifications: { total: verifications },
            },
        });
    }
    catch (err) {
        console.error('Get stats error:', err instanceof Error ? err.message : err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/candidates/:id', async (req, res, _next) => {
    try {
        const { id } = req.params;
        const candidate = await prisma.candidate.findUnique({
            where: { id },
        });
        if (!candidate) {
            res.status(404).json({ error: 'Candidate not found' });
            return;
        }
        await prisma.candidate.delete({
            where: { id },
        });
        res.status(200).json({
            message: 'Candidate deleted successfully',
        });
    }
    catch (err) {
        console.error('Delete candidate error:', err instanceof Error ? err.message : err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/users/:id', async (req, res, _next) => {
    try {
        const { id } = req.params;
        if (id === req.user?.userId) {
            res.status(400).json({ error: 'Cannot delete your own administrative account' });
            return;
        }
        const target = await prisma.user.findUnique({
            where: { id },
            include: { candidates: { select: { id: true } } }
        });
        if (!target) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const ids = target.candidates.map(c => c.id);
        await prisma.$transaction([
            prisma.verificationLog.deleteMany({
                where: { candidateId: { in: ids } }
            }),
            prisma.candidate.deleteMany({
                where: { createdById: id }
            }),
            prisma.user.delete({
                where: { id }
            })
        ]);
        res.status(200).json({
            message: 'User and all associated candidates and audit logs deleted successfully',
        });
    }
    catch (err) {
        console.error('Delete user error:', err instanceof Error ? err.message : err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=admin.routes.js.map