import { ORPCError, implement } from '@orpc/server';
import { appContract } from '@template/contracts/orpc/contract';
import { ValidationError } from '../../errors/app-errors.ts';
import { makeDemoSessionMiddleware } from '../middleware/demo-session.ts';
import type { BaseContext } from '../contexts/baseContext.ts';

export function buildHello() {
    const os = implement(appContract.hello)
        .$context<BaseContext>()
        .use(makeDemoSessionMiddleware());

    const greet = os.greet.handler(async ({ input }) => {
        if (input.name.toLowerCase() === 'rate') {
            throw new ORPCError('RATE_LIMITED', { data: { retryAfter: 1 } });
        }
        if (input.name.toLowerCase() === 'bad') {
            throw new ValidationError('Bad name', 'name');
        }
        return `Hello, ${input.name}!`;
    });

    return {
        hello: os.router({
            greet,
        }),
    } as const;
}
