import { implement, ORPCError } from '@orpc/server';
import { ValidationError } from '../../errors/app-errors.ts';
import { makeAuthMiddleware } from '../middleware/auth.ts';
import { appContract } from '@template/contracts/orpc/contract';
import type { BaseContext } from '../contexts/baseContext.ts';

export function buildHello() {
    const os = implement(appContract.hello).$context<BaseContext>().use(makeAuthMiddleware());

    const greet = os.greet.handler(async ({ input, context }) => {
        if (input.name.toLowerCase() === 'rate') {
            throw new ORPCError('RATE_LIMITED', { data: { retryAfter: 1 } });
        }
        if (input.name.toLowerCase() === 'bad') {
            throw new ValidationError('Bad name', 'name');
        }
        return `Hello, ${input.name} ! with session: ${context.session.sessionId}`;
    });

    return {
        hello: os.router({
            greet,
        }),
    } as const;
}
