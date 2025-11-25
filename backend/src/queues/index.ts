import { sumQueue } from './sum-queue.ts';

export const queues = {
    sum: sumQueue,
} as const;

// Importing this module ensures all queues self-register with queueService.
export function registerQueues() {
    return queues;
}
