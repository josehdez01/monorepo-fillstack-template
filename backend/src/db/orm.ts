import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';

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

export function makeOrmMiddleware(orm: MikroORM) {
    return function ormMiddleware(
        c: { set: (k: string, v: unknown) => void },
        next: () => Promise<void>,
    ) {
        const em = orm.em.fork();
        return RequestContext.create(em, () => {
            // Attach to Hono context variables
            // Hono augments at runtime; types are provided at app declaration site
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            c.set('em', em);
            return next();
        });
    };
}
