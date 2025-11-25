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
    // Make ts happy
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

describe.skipIf(!haveDb)('users RPC (with test DB)', () => {
    it('creates and fetches a user', async () => {
        assert(baseCtx);
        const created = await client.users.create(
            { email: 'alice@example.com' },
            {
                context: baseCtx,
            },
        );
        expect(created).toMatchObject({ email: 'alice@example.com', id: expect.any(Number) });

        const fetched = await client.users.getById({ id: created.id }, { context: baseCtx });
        expect(fetched).toMatchObject({ id: created.id, email: 'alice@example.com' });
    });

    it('rejects duplicate email', async () => {
        assert(baseCtx);

        // first create succeeds
        const first = await client.users.create(
            { email: 'dupe@example.com' },
            { context: baseCtx },
        );
        expect(first).toBeDefined();

        // second create fails with ValidationError
        await expect(
            client.users.create({ email: 'dupe@example.com' }, { context: baseCtx }),
        ).rejects.toBeInstanceOf(Error);
    });
});
