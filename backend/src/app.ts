import { Hono } from 'hono';
import type { EntityManager } from '@mikro-orm/core';
import { cors } from 'hono/cors';
import { createLogger, type Logger } from '@template/logger';

export const app = new Hono<{
    Variables: { em: EntityManager; logger: Logger; requestId: string };
}>();

app.use('*', cors());

app.get('/health', (c) => c.json({ ok: true }));

// Unified request logging middleware
app.use('*', async (c, next) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    const base = createLogger();
    const logger = base.child({ requestId });
    c.set('requestId', requestId);
    c.set('logger', logger);
    try {
        await next();
    } finally {
        const ms = Date.now() - start;
        const method = c.req.method;
        const path = new URL(c.req.url).pathname;
        const status = c.res?.status ?? 200;
        logger.info({ method, path, status, ms }, 'request complete');
    }
});

// Hono error handler to standardize REST errors
app.onError((err, c) => {
    const logger = c.var.logger ?? createLogger();
    logger.error({ err }, 'unhandled error');
    return c.json({ error: 'internal_error' }, 500);
});

// No REST application routes here — app features live under ORPC (/rpc)
