import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { EntityManager } from '@mikro-orm/core';
import type { MikroORM } from '@mikro-orm/postgresql';
import { createLogger, type Logger } from '@template/logger';
import { makeOrmMiddleware } from './db/orm.ts';
import { createRpcHandler } from './rpc.ts';
import { createBaseContext } from './rpc/contexts/baseContext.ts';

interface AppVariables {
    em: EntityManager;
    logger: Logger;
    requestId: string;
}
export interface AppOptions {
    orm?: MikroORM;
    demoSessionsEnabled?: boolean;
    logger?: Logger;
    allowedOrigins?: string[];
    trustProxy?: boolean;
    ready?: () => boolean;
}

/** A fresh Hono instance per runtime/test; no global route or middleware registration. */
export function createApp(options: AppOptions = {}) {
    const app = new Hono<{ Variables: AppVariables }>();
    const baseLogger = options.logger ?? createLogger();
    app.use('*', async (c, next) => {
        const start = performance.now();
        const requestId = crypto.randomUUID();
        const logger = baseLogger.child({ requestId });
        c.set('requestId', requestId);
        c.set('logger', logger);
        c.header('x-request-id', requestId);
        try {
            await next();
        } finally {
            logger.info(
                {
                    method: c.req.method,
                    path: new URL(c.req.url).pathname,
                    status: c.res.status,
                    ms: Math.round(performance.now() - start),
                },
                'request complete',
            );
        }
    });
    // Empty means same-origin. Cross-origin access is an explicit deployment choice.
    app.use(
        '*',
        cors({
            origin: options.allowedOrigins ?? [],
            allowHeaders: ['Content-Type', 'x-session-id'],
            exposeHeaders: ['x-request-id'],
        }),
    );
    app.get('/health', (c) => c.json({ ok: true }));
    app.get('/ready', (c) => {
        const ready = options.ready?.() ?? true;
        return c.json({ ready }, ready ? 200 : 503);
    });
    if (options.orm) {
        app.use('/rpc/*', makeOrmMiddleware(options.orm));
        const rpc = createRpcHandler();
        app.all('/rpc/*', async (c, next) => {
            const { matched, response } = await rpc.handle(c.req.raw, {
                prefix: '/rpc',
                context: await createBaseContext(
                    c,
                    options.trustProxy,
                    options.demoSessionsEnabled,
                ),
            });
            if (matched) {
                return c.newResponse(response.body, response);
            }
            await next();
        });
    }
    app.onError((error, c) => {
        (c.var.logger ?? baseLogger).error({ err: error }, 'unhandled error');
        return c.json({ error: 'internal_error', requestId: c.var.requestId }, 500);
    });
    return app;
}
