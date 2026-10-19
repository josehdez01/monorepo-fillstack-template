# Queues

`contracts/src/queues` contains Torero 0.2 producer contracts. Contracts describe stable queue names, versioned input/output schemas and enqueue defaults. Importing a contract opens no Redis connection. Backend implementations live in `src/queues`; `createQueueRuntime` owns their explicit start/close lifecycle.

```ts
import { createQueueClient } from 'torero-mq';
import { queueContracts } from '@template/contracts/queues/sum';

const client = createQueueClient(queueContracts, {
    connection: { url: process.env.REDIS_URL! },
    prefix: 'my-app',
});
try {
    const handle = await client.jobs.sum.publish({ a: 2, b: 3 });
    const result = await handle.wait({ timeoutMs: 5_000 }); // { sum: 5 }
} finally {
    await client.close();
}
```

With `pnpm dev` (ROLE=all) or a worker running, try `pnpm --filter @template/backend jobs:demo` from another terminal. Pass optional numbers, for example `pnpm --filter @template/backend jobs:demo 7 11`. The command publishes the shared sum contract, waits up to five seconds, prints the result and closes its producer connections.

`ROLE=api` starts only producers and HTTP; `ROLE=worker` starts workers without HTTP; `ROLE=all` starts both. Every worker attempt enters a new MikroORM `RequestContext` through Torero middleware. Add database work using the injected `context.em`; never reuse a global entity manager or retain an ORM entity in a job payload. Enqueue stable IDs, then look up current state in the worker.

BullMQ distributes work across worker processes natively; there is no application-level exclusive worker lease or reconciliation interval. Configure concurrency and cooperative deadlines with `.worker(...)`. A timeout aborts the handler signal and waits for it to settle, so handlers must cooperate with cancellation. Shutdown drains requests/jobs before closing the ORM.

Torero preserves raw input across retries, validates/transform it once per attempt, validates output on the worker, and transports rich values without transforming a second time on the producer. Completed results use bounded retention by default. `removeOnComplete: true` makes late result retrieval impossible. Schema wire changes require a queue contract version change and coordinated deployments.

For database-to-queue atomicity, use an application outbox. Stable per-recipient `jobId`s can deduplicate retained jobs, but do not provide exactly-once external side effects. Handlers must remain idempotent. Delayed re-engagement should recheck current eligibility before sending; cancelling delayed work alone cannot prevent an already active job.

The integration suite runs real migrated PostgreSQL and Redis in disposable containers: `pnpm test:integration` from the repository root.
