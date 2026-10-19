import { sumQueue } from './sum-queue.ts';
export { queueContracts } from '@template/contracts/queues/sum';
export const queueImplementations = { sum: sumQueue } as const;
