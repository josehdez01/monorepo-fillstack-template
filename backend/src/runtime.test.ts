import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { serve, type ServerType } from '@hono/node-server';
import { MikroORM } from '@mikro-orm/postgresql';
import { createLogger } from '@template/logger';
import { createBackendRuntime } from './runtime.ts';
import { createQueueRuntime, type QueueRuntime } from './queues/service.ts';
import { createApp } from './app.ts';
import type { Env } from './config/env.ts';

vi.mock('@mikro-orm/postgresql', () => ({ MikroORM: { init: vi.fn() } }));
vi.mock('../mikro-orm.config.ts', () => ({
    createOrmConfig: vi.fn((url) => ({ clientUrl: url })),
}));
vi.mock('@hono/node-server', () => ({ serve: vi.fn() }));
vi.mock('./queues/service.ts', () => ({ createQueueRuntime: vi.fn() }));
vi.mock('./app.ts', () => ({ createApp: vi.fn(() => ({ fetch: vi.fn() })) }));
const env: Env = {
    NODE_ENV: 'test',
    PORT: 3001,
    HOST: '127.0.0.1',
    DATABASE_URL: 'postgres://localhost/template_test',
    REDIS_URL: 'redis://localhost',
    QUEUE_PREFIX: 'runtime-test',
    CORS_ORIGINS: [],
    ROLE: 'all',
    TRUST_PROXY: false,
};
const logger = createLogger({ level: 'silent' });
function fixture(role: Env['ROLE'] = 'worker') {
    const order: string[] = [];
    const orm = {
        em: {},
        close: vi.fn(async () => {
            order.push('orm');
        }),
    };
    const queues = {
        jobs: {} as QueueRuntime['jobs'],
        start: vi.fn(async () => {}),
        close: vi.fn(async () => {
            order.push('queues');
        }),
    };
    vi.mocked(MikroORM.init).mockResolvedValue(orm as unknown as MikroORM);
    vi.mocked(createQueueRuntime).mockReturnValue(queues);
    return {
        orm,
        queues,
        order,
        runtime: createBackendRuntime({ env: { ...env, ROLE: role }, logger }),
    };
}
beforeEach(() => vi.resetAllMocks());
describe('backend resource lifecycle', () => {
    it('shares startup and shutdown, never starting HTTP for worker roles', async () => {
        const { runtime, orm, queues, order } = fixture();
        const start = runtime.start();
        expect(runtime.start()).toBe(start);
        await start;
        expect(serve).not.toHaveBeenCalled();
        expect(runtime.ready).toBe(true);
        const close = runtime.close();
        expect(runtime.close()).toBe(close);
        await close;
        expect(order).toEqual(['queues', 'orm']);
        expect(orm.close).toHaveBeenCalledOnce();
        expect(queues.close).toHaveBeenCalledOnce();
        await expect(runtime.start()).rejects.toThrow('closed');
    });
    it('closes an ORM that resolves after shutdown was requested without starting queues', async () => {
        const { runtime, orm } = fixture();
        let initialize!: (value: MikroORM) => void;
        vi.mocked(MikroORM.init).mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    initialize = resolve;
                }),
        );
        const start = runtime.start();
        const close = runtime.close();
        initialize(orm as unknown as MikroORM);
        await Promise.all([start, close]);
        expect(createQueueRuntime).not.toHaveBeenCalled();
        expect(orm.close).toHaveBeenCalledOnce();
        expect(runtime.ready).toBe(false);
    });
    it('waits for queues that finish startup after close without binding HTTP', async () => {
        const { runtime, queues, orm } = fixture('all');
        let release!: () => void;
        queues.start.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    release = resolve;
                }),
        );
        const start = runtime.start();
        await vi.waitFor(() => expect(queues.start).toHaveBeenCalledOnce());
        const close = runtime.close();
        release();
        await Promise.all([start, close]);
        expect(serve).not.toHaveBeenCalled();
        expect(queues.close).toHaveBeenCalledOnce();
        expect(orm.close).toHaveBeenCalledOnce();
    });
    it('uses production runtime configuration to disable demo sessions independently from process env', async () => {
        const { order } = fixture('api');
        const runtime = createBackendRuntime({
            env: { ...env, NODE_ENV: 'production', ROLE: 'api' },
            logger,
        });
        const listener = new EventEmitter();
        Object.assign(listener, {
            close: (callback: () => void) => {
                order.push('http');
                callback();
            },
        });
        vi.mocked(createApp).mockReturnValue({ fetch: vi.fn() } as unknown as ReturnType<
            typeof createApp
        >);
        vi.mocked(serve).mockImplementationOnce((_options, onListen) => {
            queueMicrotask(() =>
                onListen?.({ address: '127.0.0.1', family: 'IPv4', port: env.PORT }),
            );
            return listener as ServerType;
        });
        await runtime.start();
        expect(createApp).toHaveBeenCalledWith(
            expect.objectContaining({ demoSessionsEnabled: false }),
        );
        expect(createQueueRuntime).toHaveBeenCalledWith(
            expect.objectContaining({ runWorkers: false }),
        );
        await runtime.close();
        expect(order).toEqual(['http', 'queues', 'orm']);
    });
    it('cleans resources once when queue startup fails and preserves the original error', async () => {
        const { runtime, orm, queues } = fixture();
        const failure = new Error('Redis unavailable');
        queues.start.mockRejectedValueOnce(failure);
        await expect(runtime.start()).rejects.toBe(failure);
        await runtime.close();
        expect(queues.close).toHaveBeenCalledOnce();
        expect(orm.close).toHaveBeenCalledOnce();
    });
    it('closes a failed HTTP listener before queues and ORM, including bind errors', async () => {
        const { runtime, order } = fixture('api');
        const listener = new EventEmitter();
        const close = vi.fn((callback: (error?: Error) => void) => {
            order.push('http');
            callback();
        });
        Object.assign(listener, { close });
        const failure = new Error('address in use');
        vi.mocked(createApp).mockReturnValue({ fetch: vi.fn() } as unknown as ReturnType<
            typeof createApp
        >);
        vi.mocked(serve).mockImplementationOnce(() => {
            queueMicrotask(() => listener.emit('error', failure));
            return listener as ServerType;
        });
        await expect(runtime.start()).rejects.toBe(failure);
        await runtime.close();
        expect(order).toEqual(['http', 'queues', 'orm']);
        expect(close).toHaveBeenCalledOnce();
    });
    it('attempts database cleanup even if queue cleanup fails', async () => {
        const { runtime, queues, orm } = fixture();
        await runtime.start();
        queues.close.mockRejectedValueOnce(new Error('queue cleanup'));
        await expect(runtime.close()).rejects.toBeInstanceOf(AggregateError);
        expect(orm.close).toHaveBeenCalledOnce();
    });
});
