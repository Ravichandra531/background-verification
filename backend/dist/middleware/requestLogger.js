import crypto from 'crypto';
import { logger } from '../utils/logger.js';
export const requestLogger = (req, res, next) => {
    const reqId = crypto.randomUUID();
    const start = Date.now();
    res.setHeader('X-Request-Id', reqId);
    req.requestId = reqId;
    res.on('finish', () => {
        const duration = Date.now() - start;
        const meta = {
            requestId: reqId,
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        };
        if (res.statusCode >= 500) {
            logger.error('HTTP request completed', meta);
        }
        else if (res.statusCode >= 400) {
            logger.warn('HTTP request completed', meta);
        }
        else {
            logger.info('HTTP request completed', meta);
        }
    });
    next();
};
//# sourceMappingURL=requestLogger.js.map