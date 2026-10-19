import { sumJob } from '@template/contracts/queues/sum';
import { RequestContext } from '@mikro-orm/core';
import type { MikroORM } from '@mikro-orm/postgresql';
import type { Logger } from '@template/logger';
import { implement } from 'torero-mq';

export const sumQueue = implement(sumJob)
    .$context<{ orm: MikroORM; logger: Logger }>()
    .use(({ context, job, next }) =>
        RequestContext.create(context.orm.em, async () => {
            const em = RequestContext.getEntityManager();
            if (!em) {
                throw new Error('ORM job context was not initialized');
            }
            return next({
                context: {
                    em,
                    logger: context.logger.child({ queue: job.name, jobId: job.id }),
                },
            });
        }),
    )
    .worker({ concurrency: 5, timeoutMs: 10_000 })
    .handler(({ input }) => ({ sum: input.a + input.b }));
