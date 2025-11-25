import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRpcHandler } from '../rpc.ts';
import { initORM } from '../db/orm.ts';
import type { MikroORM } from '@mikro-orm/core';
import { createLogger } from '@template/logger';
import { createSessionService } from '../modules/sessions/service.ts';
import { TestDbManager } from '../test/test-db.ts';
import { getEnv } from 'src/config/env.ts';

const env = getEnv();

describe('RPC Integration', () => {
    let orm: MikroORM;

    beforeAll(async () => {
        const manager = new TestDbManager();
        await manager.startWithEmptyDB(env.DATABASE_URL!);
        orm = await initORM();
    });

    afterAll(async () => {
        await orm.close(true);
    });

    it('should return hello world', async () => {
        const rpc = createRpcHandler();
        const logger = createLogger();
        const em = orm.em.fork();
        const session = await createSessionService({ em }).create({
            type: 'user',
            ipAddress: '127.0.0.1',
            userAgent: 'integration-test',
        });

        const { response } = await rpc.handle(
            new Request('http://localhost/rpc/hello/greet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': session.sessionId,
                },
                body: JSON.stringify({ json: { name: 'Integration' } }),
            }),
            {
                prefix: '/rpc',
                context: {
                    logger,
                    em,
                    headers: new Headers({ 'x-session-id': session.sessionId }),
                    requestId: 'test-request-id',
                    ipAddress: '127.0.0.1',
                    session,
                },
            },
        );

        expect(response).toBeDefined();
        expect(response!.status).toBe(200);
        const responseData = await response!.json();
        expect(responseData.json).toBe(`Hello, Integration! session=${session.sessionId}`);
    });
});
