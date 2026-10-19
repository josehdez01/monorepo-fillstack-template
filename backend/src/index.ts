import { getEnv } from './config/env.ts';
import { createLogger } from '@template/logger';
import { createBackendRuntime } from './runtime.ts';

const logger = createLogger();
const runtime = createBackendRuntime({ env: getEnv(), logger });
let stopping = false;
const shutdown = async (signal: string) => {
    if (stopping) {
        return;
    }
    stopping = true;
    logger.info({ signal }, 'backend shutting down');
    try {
        await runtime.close();
    } catch (error) {
        logger.error({ err: error }, 'backend shutdown failed');
        process.exitCode = 1;
    }
};
process.once('SIGINT', () => {
    void shutdown('SIGINT');
});
process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
});
try {
    await runtime.start();
} catch (error) {
    logger.error({ err: error }, 'backend startup failed');
    process.exitCode = 1;
}
