import { implement } from '@orpc/server';
import { appContract } from '@template/contracts/orpc/contract';
import { createSessionService } from '../../modules/sessions/service.ts';
import type { BaseContext } from '../contexts/baseContext.ts';

export function buildSession() {
    const os = implement(appContract.session).$context<BaseContext>();

    const createSession = os.createSession.handler(async ({ input, context }) => {
        const sessionService = createSessionService({ em: context.em });

        const session = await sessionService.create({
            type: 'user',
            ipAddress: context.ipAddress,
            userAgent: input.userAgent || context.headers.get('user-agent') || 'UNKNOWN',
        });

        return { sessionId: session.sessionId };
    });

    return {
        session: os.router({
            createSession,
        }),
    } as const;
}
