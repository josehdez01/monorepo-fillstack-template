import { createQueueClient } from 'torero-mq';
import { queueContracts } from '@template/contracts/queues/sum';
import { getEnv } from '../config/env.ts';

const env = getEnv();
const client = createQueueClient(queueContracts, {
    connection: { url: env.REDIS_URL },
    prefix: env.QUEUE_PREFIX,
});
try {
    const a = Number(process.argv[2] ?? 2);
    const b = Number(process.argv[3] ?? 3);
    const handle = await client.jobs.sum.publish({ a, b });
    const result = await handle.wait({ timeoutMs: 5_000 });
    console.log(JSON.stringify({ jobId: handle.id, ...result }));
} catch (error) {
    console.error(error instanceof Error ? error.message : 'Queue demo failed');
    process.exitCode = 1;
} finally {
    await client.close();
}
