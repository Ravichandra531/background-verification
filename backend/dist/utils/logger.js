const LOG_LEVELS = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};
const minLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] ?? LOG_LEVELS.info;
function write(level, message, meta) {
    if (LOG_LEVELS[level] < minLevel)
        return;
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        service: 'verifybgc-api',
        message,
        env: process.env.NODE_ENV || 'development',
        ...meta,
    };
    const line = JSON.stringify(entry);
    if (level === 'error') {
        console.error(line);
    }
    else {
        console.log(line);
    }
}
export const logger = {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
};
//# sourceMappingURL=logger.js.map