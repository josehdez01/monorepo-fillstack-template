import { RequestContext } from '@mikro-orm/core';
import type { MikroORM } from '@mikro-orm/postgresql';
import type { MiddlewareHandler } from 'hono';

/** The runtime owns the ORM; each request receives the actual context-managed fork. */
export function makeOrmMiddleware(orm: MikroORM): MiddlewareHandler {
    return async (c, next) =>
        RequestContext.create(orm.em, async () => {
            const em = RequestContext.getEntityManager();
            if (!em) {
                throw new Error('ORM request context was not initialized');
            }
            c.set('em', em);
            await next();
        });
}
