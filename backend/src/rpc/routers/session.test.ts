import { beforeAll, afterAll, describe, it, expect, beforeEach, assert } from 'vitest';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { createRouterClient } from '@orpc/server';
import { getEnv } from '../../config/env.ts';
import { TestDbManager } from '../../test/test-db.ts';
import { createLogger } from '@template/logger';
import { createSessionService } from '../../modules/sessions/service.ts';
import type { RpcSessionContext } from '../contexts/sessionAuthContext.ts';
import type { Session } from '../../db/entities/session.ts';
import type { EntityDTO } from '@mikro-orm/core';
import { router } from './index.ts';

let orm: MikroORM | undefined;
let testDbName: string | undefined;

// Ensure required env for schema validation; override DB from TEST_DATABASE_URL if provided
if (!process.env.REDIS_URL) {
    process.env.REDIS_URL = 'redis://localhost:6379';
}
if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
const haveDb = Boolean(process.env.DATABASE_URL);

const getDummySession = async (em: EntityManager) => {
    const sessionService = createSessionService({ em });
    return sessionService.create({
        type: 'user',
        ipAddress: '127.0.0.1',
        userAgent: 'test',
    });
};

beforeAll(async () => {
    if (!haveDb) {
        return;
    }
    // Validate env via our schema
    getEnv();

    // Create or reuse a template DB, then clone a fresh ephemeral DB
    const mgr = new TestDbManager();
    const { name, url } = await mgr.createEphemeral();
    testDbName = name;
    const prev = process.env.DATABASE_URL;
    process.env.DATABASE_URL = url;

    try {
        const { default: ormConfig } = await import('../../../mikro-orm.config.ts');
        orm = await MikroORM.init(ormConfig);
    } catch (err) {
        // restore env then rethrow
        if (prev !== undefined) {
            process.env.DATABASE_URL = prev;
        } else {
            delete process.env.DATABASE_URL;
        }
        throw err;
    }
});

afterAll(async () => {
    try {
        if (orm) {
            await orm.close(true);
        }
    } finally {
        if (testDbName) {
            const mgr = new TestDbManager();
            await mgr.dropDatabase(testDbName);
        }
    }
});

let em: EntityManager | undefined;
let dummySession: EntityDTO<Session> | undefined;
const client = createRouterClient(router, { context: (c: RpcSessionContext) => c });
let baseCtx: RpcSessionContext | undefined;

beforeEach(async () => {
    if (!haveDb) {
        return;
    }
    if (!orm) {
        throw new Error('orm not initialized');
    }
    em = orm?.em.fork();
    dummySession = await getDummySession(em!);
    if (!em || !dummySession) {
        throw new Error('failed to initialize test DB');
    }

    const logger = createLogger();
    assert(em);
    assert(dummySession);
    baseCtx = {
        requestId: 't1',
        logger,
        em,
        headers: new Headers(),
        session: dummySession,
        ipAddress: '127.0.0.1',
    };
});

describe.skipIf(!haveDb)('session RPC (with test DB)', () => {
    it('creates a session and persists header/userAgent', async () => {
        assert(baseCtx);

        // No input userAgent; should read from headers and ip from context
        const res = await client.session.createSession(
            {},
            { context: { ...baseCtx, headers: new Headers({ 'user-agent': 'TestAgent' }) } },
        );

        expect(res).toEqual({ sessionId: expect.any(String) });

        // Verify persisted values
        assert(em);
        const svc = createSessionService({ em });
        const fetched = await svc.getById(res.sessionId);
        expect(fetched).toBeTruthy();
        expect(fetched?.userAgent).toBe('TestAgent');
        expect(fetched?.ipAddress).toBe('127.0.0.1');
    });

    it('allows access to protected route with valid session', async () => {
        assert(baseCtx);
        const result = await client.hello.greet({ name: 'World' }, { context: baseCtx });
        expect(result).toBe('Hello, World !');
    });

    it('denies access to protected route without session', async () => {
        assert(baseCtx);
        const ctxWithoutSession = {
            ...baseCtx,
            session: undefined,
            headers: new Headers(),
        } as unknown as RpcSessionContext;
        await expect(
            client.hello.greet({ name: 'World' }, { context: ctxWithoutSession }),
        ).rejects.toBeInstanceOf(Error);
    });
});
