import { ORPCError, os } from '@orpc/server';
import type { BaseContext } from '../contexts/baseContext.ts';
import type { RpcSessionContext } from '../contexts/sessionAuthContext.ts';
import type { EntityDTO } from '@mikro-orm/core';
import type { Session } from '../../db/entities/session.ts';
import { createSessionService } from '../../modules/sessions/service.ts';

export function makeAuthMiddleware() {
    return os
        .$context<Partial<RpcSessionContext> & BaseContext>()
        .middleware(async ({ context, next }) => {
            let baseLogger = context.logger;

            let session: EntityDTO<Session> | undefined = context.session;
            if (!session) {
                const sessionId = context.headers.get('x-session-id');
                if (!sessionId) {
                    throw new ORPCError('UNAUTHORIZED', {
                        message: 'Session required',
                        status: 401,
                    });
                }

                const sessionService = createSessionService({ em: context.em });
                const foundSession = await sessionService.getById(sessionId);
                if (!foundSession) {
                    throw new ORPCError('UNAUTHORIZED', {
                        message: 'Session required',
                        status: 401,
                    });
                }
                session = foundSession;
            }

            if (!session) {
                throw new ORPCError('UNAUTHORIZED', {
                    message: 'Session required',
                    status: 401,
                });
            }

            baseLogger = baseLogger.child({ sessionId: session.sessionId });
            return await next({ context: { ...context, session, logger: baseLogger } });
        });
}
