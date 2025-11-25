import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import type { AppContract } from '@template/contracts/orpc/contract';

describe('oRPC hello (typed)', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('calls hello.greet and returns a string', async () => {
        const base = 'http://localhost:3000/rpc';

        const fetchMock = async (
            request: Request,
            _init: { redirect?: Request['redirect'] },
            _options: Record<string, unknown>,
            _path: readonly string[],
            _input: unknown,
        ): Promise<Response> => {
            const url = new URL(request.url);
            expect(url.pathname).toBe('/rpc/hello/greet');
            const body = JSON.stringify({ json: 'Hello, world!' });
            return new Response(body, {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        };

        const client: ContractRouterClient<AppContract> = createORPCClient(
            new RPCLink({ url: base, fetch: fetchMock }),
        );

        const res = await client.hello.greet({ name: 'world' });
        expect(res).toBe('Hello, world!');
    });
});
