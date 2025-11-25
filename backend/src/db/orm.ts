import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import type { MiddlewareHandler } from 'hono';
import ormConfig from '../../mikro-orm.config.ts';

let ormInstance: MikroORM | undefined;

export async function initORM(): Promise<MikroORM> {
    if (ormInstance) {
        return ormInstance;
    }
    ormInstance = await MikroORM.init(ormConfig);
    return ormInstance;
}

export function getORM(): MikroORM {
    if (!ormInstance) {
        throw new Error('ORM not initialized. Call initORM() first.');
    }
    return ormInstance;
}

export function makeOrmMiddleware(orm: MikroORM): MiddlewareHandler {
    return async function ormMiddleware(c, next) {
        const em = orm.em.fork();
        await RequestContext.create(em, () => {
            c.set('em', em);
            return next();
        });
    };
}
