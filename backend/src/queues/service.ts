import type { MikroORM } from '@mikro-orm/postgresql';
import type { Logger } from '@template/logger';
import { createQueueClient, createWorkers, type ConnectionSettings } from 'torero-mq';
import { queueContracts, queueImplementations } from './index.ts';

export function createQueueRuntime(
    options: ConnectionSettings & { orm: MikroORM; logger: Logger; runWorkers: boolean },
) {
    const client = createQueueClient(queueContracts, options);
    const workers = options.runWorkers
        ? createWorkers(queueImplementations, {
              ...options,
              context: () => ({ orm: options.orm, logger: options.logger }),
          })
        : undefined;
    let starting: Promise<void> | undefined;
    let closing: Promise<void> | undefined;
    let closed = false;
    return {
        jobs: client.jobs,
        start() {
            if (closed) {
                return Promise.reject(new Error('Queue runtime is closed'));
            }
            return (starting ??= (async () => {
                try {
                    await Promise.all([client.start(), workers?.start()]);
                } catch (error) {
                    await Promise.allSettled([client.close(), workers?.close()]);
                    throw error;
                }
            })());
        },
        close() {
            closed = true;
            return (closing ??= (async () => {
                // Stop accepting/observing work before releasing the database owner.
                const results = await Promise.allSettled([client.close(), workers?.close()]);
                const errors = results
                    .filter((result) => result.status === 'rejected')
                    .map((result) => result.reason as unknown);
                if (errors.length) {
                    throw new AggregateError(errors, 'Queue shutdown failed');
                }
            })());
        },
    };
}
export type QueueRuntime = ReturnType<typeof createQueueRuntime>;
