import { onError, ORPCError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { router } from './rpc/routers/index.ts';
import { createLogger } from '@template/logger';

export function createRpcHandler() {
    const fallback = createLogger();
    return new RPCHandler(router, {
        interceptors: [
            onError((error, { context }) => {
                const logger = context.logger ?? fallback;
                if (error instanceof ORPCError && error.status < 500) {
                    logger.debug(
                        { code: error.code, status: error.status },
                        'rpc request rejected',
                    );
                } else {
                    logger.error({ err: error }, 'rpc request failed');
                }
            }),
        ],
    });
}
