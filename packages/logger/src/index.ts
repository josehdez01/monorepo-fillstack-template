import pino, { type DestinationStream, type Logger, type LoggerOptions } from 'pino';

export type { Logger } from 'pino';

export const createLogger = (options?: LoggerOptions, destination?: DestinationStream): Logger => {
    let level: LoggerOptions['level'] = 'debug';
    if (process.env.NODE_ENV === 'production') {
        level = 'info';
    }

    const base: LoggerOptions = {
        level,
        redact: {
            paths: [
                'password',
                'token',
                'sessionId',
                'authorization',
                'cookie',
                'req.headers.authorization',
                'req.headers.cookie',
                'headers.authorization',
                'headers.cookie',
                'headers["x-session-id"]',
                'req.headers["x-session-id"]',
                'res.headers["set-cookie"]',
            ],
            censor: '[REDACTED]',
        },
        ...options,
    };

    return destination ? pino(base, destination) : pino(base);
};

export const withRequest = (logger: Logger, reqId: string): Logger => logger.child({ reqId });
