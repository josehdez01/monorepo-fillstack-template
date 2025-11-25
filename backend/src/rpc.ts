import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { router } from './rpc/routers/index.ts';

// Build and return an RPC handler (router) for mounting under /rpc
export function createRpcHandler() {
    const handler = new RPCHandler(router, {
        interceptors: [
            onError((error) => {
                if (error instanceof Error) {
                    console.error('RPC Error', { message: error.message });
                } else {
                    console.error('RPC Error');
                }
            }),
        ],
    });

    return handler;
}
