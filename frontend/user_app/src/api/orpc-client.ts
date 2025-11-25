import { createORPCClient, createSafeClient, type SafeClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import { RequestValidationPlugin } from '@orpc/contract/plugins';
import { appContract, type AppContract } from '@template/contracts/orpc/contract';
import { parseViteEnv } from '@template/env';
import { z } from 'zod';

export type AppClient = ContractRouterClient<AppContract>;
export type SafeAppClient = SafeClient<AppClient>;

export function makeClient(base: string): AppClient {
    const url = `${base.replace(/\/$/, '')}/rpc`;
    const env = parseViteEnv({ VITE_ORPC_VALIDATE_REQUESTS: z.coerce.boolean().default(false) });
    const plugins = env.VITE_ORPC_VALIDATE_REQUESTS
        ? [new RequestValidationPlugin(appContract)]
        : [];
    return createORPCClient(new RPCLink({ url, plugins }));
}

export function makeSafeClient(base: string): SafeAppClient {
    const client = makeClient(base);
    return createSafeClient(client);
}
