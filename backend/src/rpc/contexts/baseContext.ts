import type { Context } from 'hono';
import type { EntityManager } from '@mikro-orm/core';
import { createLogger } from '@template/logger';
import { getConnInfo } from '@hono/node-server/conninfo';

export interface BaseContext {
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
): Promise<BaseContext> {
    const requestId = c.var.requestId ?? crypto.randomUUID();
    let baseLogger = c.var.logger ?? createLogger();
    const em = c.var.em;
    const headers = c.req.raw.headers;

    const info = getConnInfo(c);
    const remoteAddress = info.remote.address;

    const ipAddress = headers.get('x-forwarded-for') || remoteAddress || '0.0.0.0';

    const logger = baseLogger.child({ requestId });

    return { requestId, ipAddress, logger, em, headers };
}
