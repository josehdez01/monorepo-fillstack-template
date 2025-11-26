import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import { RequestValidationPlugin } from '@orpc/contract/plugins';
import { appContract, type AppContract } from '@template/contracts/orpc/contract';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { getPublicEnv } from '@/env';

export type AppClient = ContractRouterClient<AppContract>;

export interface MakeClientOptions {
    baseUrl: string;
    validateRequests?: boolean;
}

export function makeClient({ baseUrl, validateRequests = true }: MakeClientOptions): AppClient {
    const url = `${baseUrl.replace(/\/$/, '')}/rpc`;
    const plugins = validateRequests ? [new RequestValidationPlugin(appContract)] : [];
    return createORPCClient(
        new RPCLink({
            url,
            plugins,
            headers: () => {
                if (typeof window === 'undefined') {
                    return {};
                }
                const sessionId = window.localStorage.getItem('sessionId');
                if (!sessionId) {
                    return {};
                }
                return {
                    'x-session-id': sessionId,
                };
            },
        }),
    );
}

const env = getPublicEnv();

const client = makeClient({
    baseUrl: env.VITE_RPC_URL,
    validateRequests: env.VITE_ORPC_VALIDATE_REQUESTS,
});

export const orpc = createTanstackQueryUtils(client);
