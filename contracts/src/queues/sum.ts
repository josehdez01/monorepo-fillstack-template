import { job } from 'torero-mq/contract';
import { z } from 'zod';

/** Producer-safe contract: importing it never starts workers or opens Redis. */
export const sumJob = job('sum', { version: 1 })
    .input(z.object({ a: z.number().finite(), b: z.number().finite() }))
    .output(z.object({ sum: z.number().finite() }))
    .options({ attempts: 3, backoff: { type: 'exponential', delay: 500 } });

export const queueContracts = { sum: sumJob } as const;
