import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRpcHandler } from '../rpc.ts';
import { initORM } from '../db/orm.ts';
import type { EntityDTO, MikroORM } from '@mikro-orm/core';
import { createLogger } from '@template/logger';
import type { Session } from '../db/entities/session.ts';

describe('RPC Integration', () => {
    let orm: MikroORM;

    beforeAll(async () => {
        // Ensure clean DB state
        const { TestDbManager } = await import('../test/test-db.ts');
        const manager = new TestDbManager();
        await manager.startWithEmptyDB(process.env.DATABASE_URL!);
        orm = await initORM();
    });

    afterAll(async () => {
        await orm.close(true);
    });

    it('should return hello world', async () => {
        const rpc = createRpcHandler();
        const logger = createLogger();
        const em = orm.em.fork();

        const { response } = await rpc.handle(
            new Request('http://localhost/rpc/hello/greet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ json: { name: 'Integration' } }),
            }),
            {
                prefix: '/rpc',
                context: {
                    logger,
                    em,
                    headers: new Headers(),
                    requestId: 'test-request-id',
                    ipAddress: '127.0.0.1',
                    session: { sessionId: 'test-session-id' } as unknown as EntityDTO<Session>,
                },
            },
        );

        expect(response).toBeDefined();
        expect(response!.status).toBe(200);
        const responseData = await response!.json();
        expect(responseData.json).toBe('Hello, Integration! session=test-session-id');
    });
});
