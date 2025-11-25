import { serve } from '@hono/node-server';
import { createRpcHandler } from './rpc.ts';
import { createBaseContext } from './rpc/contexts/baseContext.ts';
import { app } from './app.ts';
import { getEnv } from './config/env.ts';
import { createLogger } from '@template/logger';
import { initORM, makeOrmMiddleware } from './db/orm.ts';
import { RequestContext } from '@mikro-orm/core';
import { queueService, setQueueRunWithContext } from './queues/service.ts';
import { makeRedis } from './infra/redis.ts';
import { registerQueues } from './queues/index.ts';

const env = getEnv();
const logger = createLogger();
const rpc = createRpcHandler();

async function bootstrap() {
    const orm = await initORM();
    
    // Register queues in one place for clarity
    registerQueues();
    // Initialize queues after app/ORM setup
    await queueService.initQueues({
        connection: makeRedis(),
    });
    // Periodic worker reconcile to recover from orphaned locks
    const reconcileHandle = setInterval(() => {
        void queueService
            .reconcileWorkers()
            .catch((err) => logger.warn({ err }, 'reconcileWorkers error'));
    }, 15_000);

    // Attach ORM middleware to Hono
    app.use('*', makeOrmMiddleware(orm));
    // Mount ORPC into Hono using fetch adapter
    const BODY_PARSER_METHODS = new Set([
        'arrayBuffer',
        'blob',
        'formData',
        'json',
        'text',
    ] as const);
    type BodyParserMethod = typeof BODY_PARSER_METHODS extends Set<infer T> ? T : never;
    function isBodyParserMethod(prop: unknown): prop is BodyParserMethod {
        return typeof prop === 'string' && (BODY_PARSER_METHODS as Set<string>).has(prop);
    }

    app.use('/rpc/*', async (c, next) => {
        const request = new Proxy(c.req.raw, {
            get(target, prop, receiver) {
                if (isBodyParserMethod(prop)) {
                    // Delegate to Hono parsers if requested by adapter
                    return () => c.req[prop]();
                }
                return Reflect.get(target, prop, receiver);
            },
        });

        const { matched, response } = await rpc.handle(request, {
            prefix: '/rpc',
            context: await createBaseContext(c),
        });

        if (matched) {
            return c.newResponse(response.body, response);
        }

        await next();
    });
    // Configure torero-mq to run jobs inside MikroORM RequestContext
    setQueueRunWithContext(async <T>(fn: () => Promise<T>) => {
        const em = orm.em.fork({ useContext: true });
        return await RequestContext.create(em, fn);
    });

    // Start HTTP server using Hono's Node adapter
    logger.info(`Backend HTTP+RPC starting on 0.0.0.0:${env.PORT}`);
    const server = await serve({
        fetch: app.fetch,
        port: env.PORT,
        hostname: '0.0.0.0',
    });

    const shutdown = async () => {
        logger.info('Shutting down gracefully');
        clearInterval(reconcileHandle);
        server.close();
        await orm.close(true);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

await bootstrap();
