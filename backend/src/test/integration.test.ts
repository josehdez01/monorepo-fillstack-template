import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createQueueClient } from 'torero-mq';
import { queueContracts } from '@template/contracts/queues/sum';
import { createLogger } from '@template/logger';
import { createTestDatabase } from './database.ts';
import { createApp } from '../app.ts';
import { SessionModel } from '../db/entities/session.ts';
import { UserModel } from '../db/entities/user.ts';
import { createSessionService, DEMO_SESSION_TTL_MS } from '../modules/sessions/service.ts';
import { createBackendRuntime } from '../runtime.ts';
import { getEnv } from '../config/env.ts';

const integration = process.env.TEST_INTEGRATION === '1';
describe.skipIf(!integration)('application integration (isolated PostgreSQL + Redis)', () => {
    let database: Awaited<ReturnType<typeof createTestDatabase>>;
    let app: ReturnType<typeof createApp>;
    let token: string;
    beforeAll(async () => {
        database = await createTestDatabase();
        app = createApp({ orm: database.orm, logger: createLogger(), demoSessionsEnabled: true });
    });
    afterAll(async () => {
        await database?.close();
    });
    beforeEach(async () => {
        const em = database.orm.em.fork();
        await em.nativeDelete(SessionModel.entity, {});
        await em.nativeDelete(UserModel.entity, {});
        token = (await createSessionService({ em }).create({ type: 'user' })).sessionId;
    });
    async function rpc(path: string, input: unknown, sessionId: string | undefined = token) {
        const headers = new Headers({ 'content-type': 'application/json' });
        if (sessionId) {
            headers.set('x-session-id', sessionId);
        }
        const response = await app.request(`/rpc/${path}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ json: input }),
        });
        return {
            status: response.status,
            body: (await response.json()) as { json: Record<string, unknown> },
            headers: response.headers,
        };
    }
    it('serves RPC through the real Hono adapter with request-scoped metadata', async () => {
        const result = await rpc('hello/greet', { name: 'Integration' });
        expect(result.status).toBe(200);
        expect(result.body.json).toBe('Hello, Integration!');
        expect(result.headers.get('x-request-id')).toMatch(/^[a-f0-9-]{36}$/);
        expect(result.headers.get('access-control-allow-origin')).toBeNull();
    });
    it('issues, validates, and revokes demo sessions over the actual RPC protocol', async () => {
        const created = await rpc(
            'session/createSession',
            { userAgent: 'Integration Agent' },
            undefined,
        );
        expect(created.status).toBe(200);
        const sessionId = created.body.json.sessionId as string;
        expect((await rpc('hello/greet', { name: 'Demo' }, sessionId)).status).toBe(200);
        expect((await rpc('session/revokeSession', {}, sessionId)).body.json).toEqual({
            revoked: true,
        });
        expect((await rpc('hello/greet', { name: 'Revoked' }, sessionId)).status).toBe(401);
    });
    it('rejects malformed, unknown, and expired bearer tokens', async () => {
        for (const invalid of ['', 'not-a-uuid', randomUUID()]) {
            expect((await rpc('hello/greet', { name: 'Denied' }, invalid)).status).toBe(401);
        }
        await database.orm.em
            .fork()
            .nativeUpdate(
                SessionModel.entity,
                { sessionId: token },
                { expiresAt: new Date(Date.now() - 1) },
            );
        expect((await rpc('hello/greet', { name: 'Expired' })).status).toBe(401);
    });
    it('enforces a bounded session lifetime with a controllable clock', async () => {
        let time = new Date('2030-01-01');
        const service = createSessionService({ em: database.orm.em.fork(), now: () => time });
        const created = await service.create({ type: 'user' });
        expect(created.expiresAt).toEqual(new Date(time.getTime() + DEMO_SESSION_TTL_MS));
        expect(await service.getById(created.sessionId)).not.toBeNull();
        time = new Date(time.getTime() + DEMO_SESSION_TTL_MS);
        expect(await service.getById(created.sessionId)).toBeNull();
    });
    it('creates and reads normalized users and atomically resolves concurrent duplicate emails', async () => {
        const attempts = await Promise.all([
            rpc('users/create', { email: 'ALICE@example.com' }),
            rpc('users/create', { email: 'alice@example.com' }),
        ]);
        expect(attempts.map((result) => result.status).toSorted()).toEqual([200, 409]);
        const success = attempts.find((result) => result.status === 200)!;
        const conflict = attempts.find((result) => result.status === 409)!;
        expect(success.body.json).toMatchObject({
            email: 'alice@example.com',
            id: expect.any(Number),
        });
        expect(conflict.body.json).toMatchObject({ code: 'CONFLICT', data: { field: 'email' } });
        expect((await rpc('users/getById', { id: success.body.json.id })).body.json).toEqual(
            success.body.json,
        );
        expect((await rpc('users/getById', { id: 999999 })).status).toBe(404);
    });
    it('starts worker-only runtimes once and drains them without an HTTP server', async () => {
        const prefix = `integration-${randomUUID()}`;
        const redisUrl = process.env.TEST_REDIS_URL!;
        const runtime = createBackendRuntime({
            env: {
                ...getEnv(),
                DATABASE_URL: database.url,
                REDIS_URL: redisUrl,
                QUEUE_PREFIX: prefix,
                ROLE: 'worker',
            },
        });
        const client = createQueueClient(queueContracts, { connection: { url: redisUrl }, prefix });
        try {
            const first = runtime.start();
            expect(runtime.start()).toBe(first);
            await first;
            expect(runtime.ready).toBe(true);
            const handle = await client.jobs.sum.publish({ a: 4, b: 5 });
            expect(await handle.wait({ timeoutMs: 5_000 })).toEqual({ sum: 9 });
        } finally {
            await client.close();
            await runtime.close();
        }
        expect(runtime.ready).toBe(false);
        await expect(runtime.start()).rejects.toThrow('closed');
    });
    it('never mutates the parent connection configuration or refreshes application databases', async () => {
        const before = process.env.DATABASE_URL;
        const other = await createTestDatabase();
        try {
            expect(other.name).not.toBe(database.name);
            expect(process.env.DATABASE_URL).toBe(before);
            expect(await database.orm.em.fork().count(SessionModel.entity, {})).toBe(1);
        } finally {
            await other.close();
        }
    });
});
