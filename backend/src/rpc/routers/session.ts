import { ORPCError, implement } from '@orpc/server';
import { appContract } from '@template/contracts/orpc/contract';
import { createSessionService } from '../../modules/sessions/service.ts';
import type { BaseContext } from '../contexts/baseContext.ts';
import { makeDemoSessionMiddleware } from '../middleware/demo-session.ts';

export function buildSession() {
    const os = implement(appContract.session).$context<BaseContext>();
    const createSession = os.createSession.handler(async ({ input, context }) => {
        if (!context.demoSessionsEnabled) {
            throw new ORPCError('FORBIDDEN', {
                message: 'Demo sessions are disabled in production',
            });
        }
        const session = await createSessionService({ em: context.em }).create({
            type: 'user',
            ipAddress: context.ipAddress,
            userAgent: input.userAgent ?? context.headers.get('user-agent') ?? 'UNKNOWN',
        });
        return { sessionId: session.sessionId };
    });
    const revokeSession = os.revokeSession
        .use(makeDemoSessionMiddleware())
        .handler(async ({ context }) => {
            await createSessionService({ em: context.em }).revoke(context.session.sessionId);
            return { revoked: true };
        });
    return { session: os.router({ createSession, revokeSession }) } as const;
}
