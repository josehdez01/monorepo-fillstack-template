import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRouterClient } from '@orpc/server';
import { createLogger } from '@template/logger';
import type { EntityManager } from '@mikro-orm/core';
import { router } from './routers/index.ts';
import type { BaseContext } from './contexts/baseContext.ts';
import { resetEnvCache } from '../config/env.ts';

const em = {
    getRepository: () => {
        throw new Error('Database must not be queried');
    },
} as unknown as EntityManager;
const context: BaseContext = {
    demoSessionsEnabled: false,
    em,
    headers: new Headers(),
    logger: createLogger(),
    requestId: 'unit',
    ipAddress: '127.0.0.1',
};
const client = createRouterClient(router, { context });
afterEach(() => {
    vi.unstubAllEnvs();
    resetEnvCache();
});
describe('demo session boundary', () => {
    it('denies issuance and demo-only operations in production before database access', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        resetEnvCache();
        await expect(client.session.createSession({})).rejects.toMatchObject({ code: 'FORBIDDEN' });
        await expect(client.hello.greet({ name: 'Demo' })).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        await expect(client.users.create({ email: 'demo@example.com' })).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
    });
    it('rejects malformed bearer tokens before accessing the database', async () => {
        const enabledClient = createRouterClient(router, {
            context: { ...context, demoSessionsEnabled: true },
        });
        await expect(enabledClient.hello.greet({ name: 'Demo' })).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        const malformedClient = createRouterClient(router, {
            context: {
                ...context,
                demoSessionsEnabled: true,
                headers: new Headers({ 'x-session-id': 'malformed' }),
            },
        });
        await expect(malformedClient.hello.greet({ name: 'Demo' })).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
    });
});
