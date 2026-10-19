import { serve, type ServerType } from '@hono/node-server';
import { createLogger, type Logger } from '@template/logger';
import { MikroORM } from '@mikro-orm/postgresql';
import { createOrmConfig } from '../mikro-orm.config.ts';
import { createApp } from './app.ts';
import type { Env } from './config/env.ts';
import { createQueueRuntime, type QueueRuntime } from './queues/service.ts';

export interface BackendRuntimeOptions {
    env: Env;
    logger?: Logger;
}

export function createBackendRuntime({ env, logger = createLogger() }: BackendRuntimeOptions) {
    let orm: MikroORM | undefined;
    let queues: QueueRuntime | undefined;
    let server: ServerType | undefined;
    let starting: Promise<void> | undefined;
    let closing: Promise<void> | undefined;
    let closed = false;
    let ready = false;
    let resourcesClosed = false;
    const closeResources = async () => {
        if (resourcesClosed) {
            return;
        }
        resourcesClosed = true;
        ready = false;
        const failures: unknown[] = [];
        // Drain requests and jobs before their shared database is closed.
        if (server) {
            try {
                await new Promise<void>((resolve, reject) =>
                    server!.close((error) =>
                        error && !('code' in error && error.code === 'ERR_SERVER_NOT_RUNNING')
                            ? reject(error)
                            : resolve(),
                    ),
                );
            } catch (error) {
                failures.push(error);
            }
        }
        try {
            await queues?.close();
        } catch (error) {
            failures.push(error);
        }
        try {
            await orm?.close(true);
        } catch (error) {
            failures.push(error);
        }
        if (failures.length) {
            throw new AggregateError(failures, 'Backend shutdown failed');
        }
    };
    return {
        get ready() {
            return ready;
        },
        start(): Promise<void> {
            if (closed) {
                return Promise.reject(new Error('Backend runtime is closed'));
            }
            return (starting ??= (async () => {
                try {
                    orm = await MikroORM.init(createOrmConfig(env.DATABASE_URL));
                    if (closed) {
                        return;
                    }
                    queues = createQueueRuntime({
                        connection: { url: env.REDIS_URL },
                        prefix: env.QUEUE_PREFIX,
                        logger,
                        orm,
                        runWorkers: env.ROLE !== 'api',
                    });
                    await queues.start();
                    if (closed) {
                        return;
                    }
                    if (env.ROLE !== 'worker') {
                        const app = createApp({
                            orm,
                            logger,
                            demoSessionsEnabled: env.NODE_ENV !== 'production',
                            allowedOrigins: env.CORS_ORIGINS,
                            trustProxy: env.TRUST_PROXY,
                            ready: () => ready,
                        });
                        await new Promise<void>((resolve, reject) => {
                            const instance = serve(
                                { fetch: app.fetch, port: env.PORT, hostname: env.HOST },
                                () => {
                                    instance.removeListener('error', reject);
                                    resolve();
                                },
                            );
                            server = instance;
                            instance.once('error', reject);
                        });
                    }
                    ready = true;
                    logger.info(
                        { role: env.ROLE, port: env.ROLE === 'worker' ? undefined : env.PORT },
                        'backend ready',
                    );
                } catch (error) {
                    closed = true;
                    try {
                        await closeResources();
                    } catch (cleanup) {
                        throw new AggregateError(
                            [error, cleanup],
                            'Backend startup and cleanup failed',
                            { cause: cleanup },
                        );
                    }
                    throw error;
                }
            })());
        },
        close(): Promise<void> {
            closed = true;
            return (closing ??= (async () => {
                await starting?.catch(() => {});
                await closeResources();
            })());
        },
    };
}
