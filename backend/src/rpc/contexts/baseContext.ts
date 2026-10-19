import { isIP } from 'node:net';
import type { Context } from 'hono';
import type { EntityManager } from '@mikro-orm/core';
import { createLogger } from '@template/logger';
import { getConnInfo } from '@hono/node-server/conninfo';

export interface BaseContext {
    demoSessionsEnabled: boolean;
    requestId: string;
    ipAddress: string;
    logger: ReturnType<typeof createLogger>;
    em: EntityManager;
    headers: Headers;
}

export async function createBaseContext(
    c: Context<{
        Variables: {
            em: EntityManager;
            logger: ReturnType<typeof createLogger>;
            requestId: string;
        };
    }>,
    trustProxy = false,
    demoSessionsEnabled = false,
): Promise<BaseContext> {
    const requestId = c.var.requestId ?? crypto.randomUUID();
    const baseLogger = c.var.logger ?? createLogger();
    const em = c.var.em;
    const headers = c.req.raw.headers;

    let remoteAddress = '0.0.0.0';
    // app.request tests do not have the Node server's socket binding.
    try {
        remoteAddress = getConnInfo(c).remote.address ?? remoteAddress;
    } catch {
        /* No network binding. */
    }
    const forwarded = trustProxy
        ? headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        : undefined;
    const ipAddress = forwarded && isIP(forwarded) ? forwarded : remoteAddress;

    const logger = baseLogger.child({ requestId });

    return { requestId, ipAddress, logger, em, headers, demoSessionsEnabled };
}
