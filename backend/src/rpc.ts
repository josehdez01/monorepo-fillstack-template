import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { router } from './rpc/routers/index.ts';
import { createLogger } from '@template/logger';

// Build and return an RPC handler (router) for mounting under /rpc
export function createRpcHandler() {
    const logger = createLogger();
    const handler = new RPCHandler(router, {
        interceptors: [
            onError((error) => {
                if (error instanceof Error) {
                    logger.error({ err: error }, 'rpc error');
                    return;
                }
                logger.error('rpc error');
            }),
        ],
    });

    return handler;
}
