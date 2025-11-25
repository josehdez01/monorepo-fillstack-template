# Queues: Typed BullMQ Facade

- Define queues with Zod and a process function.
- Inject Redis connection at init.
- Optional worker output validation.
- Idempotent publish/schedule and repeatable jobs as a result stream.
- Exclusive worker lock per queue (opt‑in via flag).

## Quick Start

```ts
// backend/src/queues/sum-queue.ts
import { z } from 'zod';
import { queueService } from '../queues/service.ts';

export const sumQueue = queueService.defineQueue({
    name: 'sum',
    inputSchema: z.object({ a: z.number(), b: z.number() }),
    outputSchema: z.object({ sum: z.number() }),
    async process(input) {
        return { sum: input.a + input.b };
    },
    defaults: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 500 },
        timeoutMs: 10_000,
        removeOnComplete: true,
        removeOnFail: false,
        concurrency: 5,
    },
});
```

## Init Modes

Producer‑only:

```ts
import { queueService } from '../queues/service.ts';
import { makeRedis } from '../infra/redis.ts';

await queueService.initQueues({ connection: makeRedis() });
```

Worker process:

```ts
await queueService.initQueues({ connection: makeRedis() });
// Periodically reconcile orphaned workers (lock handoff)
setInterval(() => queueService.reconcileWorkers(), 15_000);
```

## Publishing

```ts
const { jobId, awaitResult } = await sumQueue.publish({ a: 1, b: 2 });
const result = await awaitResult();
```

- Input is validated with Zod on publish and again inside the worker.
- Output is validated when `outputSchema` is provided.

## Options Builder and Idempotency

```ts
import { toBullOptions, deriveJobId } from 'torero-mq';

const opts = toBullOptions({ attempts: 2 }, { priority: 5 });
// Predictable job id from your own idempotency key
const id = deriveJobId('queues', 'sum', 'user:42');
```

## Late Registration

If a queue registers after `initQueues()` and late registration is disabled, an error guides you:

“Queue 'X' registered after initQueues(). Do one of: (1) import earlier, (2) set allowLateRegistration: true, or (3) call queueService.materialize('X') manually.”

You can enable this either by:

```ts
queueService.allowLateRegistration();
// or
await queueService.initQueues({ connection, runWorkers: false, allowLateRegistration: true });
```

## Exclusive Workers

- Enabled by default when `runWorkers: true`.
- Uses a Redis key lock per queue with a heartbeat.
- Disable with `exclusiveWorkers: false`.

## Typing Tips

- The queue name is a literal type, which flows to `ctx.queueName`.
- Collect handles in a map to get end‑to‑end types:

```ts
export const queues = { sum: sumQueue };
// Full result type from publish
export type SumOut = Awaited<ReturnType<typeof queues.sum.publish>>;
```
