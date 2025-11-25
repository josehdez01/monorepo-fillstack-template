import pino, { type Logger, type LoggerOptions } from 'pino';

export type { Logger } from 'pino';

export const createLogger = (options?: LoggerOptions): Logger => {
    let level: LoggerOptions['level'] = 'debug';
    if (process.env.NODE_ENV === 'production') {
        level = 'info';
    }

    const base: LoggerOptions = {
        level,
        ...options,
    };

    return pino(base);
};

export const withRequest = (logger: Logger, reqId: string): Logger => logger.child({ reqId });
