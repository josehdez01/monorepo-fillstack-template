import { QueueService } from 'torero-mq';
import { getEnv } from '../config/env.ts';

let runWithContextRef: (<T>(fn: () => Promise<T>) => Promise<T>) | undefined;

export function setQueueRunWithContext(fn: <T>(fn: () => Promise<T>) => Promise<T>): void {
    runWithContextRef = fn;
}

export const queueService = new QueueService({
    prefix: 'queues',
    runWorkers: getEnv().ROLE !== 'api',
    exclusiveWorkers: true,
    runWithContext: async <T>(fn: () => Promise<T>) => {
        const r = runWithContextRef;
        return r ? await r(fn) : await fn();
    },
});

export type {
    AwaitResult,
    PublishOptions,
    ScheduleOptions,
    RepeatSpec,
    RepeatStream,
} from 'torero-mq';
