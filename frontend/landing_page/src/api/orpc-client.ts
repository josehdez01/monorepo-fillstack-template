import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import { RequestValidationPlugin } from '@orpc/contract/plugins';
import { appContract, type AppContract } from '@template/contracts/orpc/contract';

export type AppClient = ContractRouterClient<AppContract>;

export interface MakeClientOptions {
    baseUrl: string;
    validateRequests?: boolean;
}

export function makeClient({ baseUrl, validateRequests = true }: MakeClientOptions): AppClient {
    const url = `${baseUrl.replace(/\/$/, '')}/rpc`;
    const plugins = validateRequests ? [new RequestValidationPlugin(appContract)] : [];
    return createORPCClient(new RPCLink({ url, plugins }));
}
