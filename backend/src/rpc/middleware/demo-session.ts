import { ORPCError, os } from '@orpc/server';
import { z } from 'zod';
import type { BaseContext } from '../contexts/baseContext.ts';
import { createSessionService } from '../../modules/sessions/service.ts';

const SessionToken = z.uuid();

/** Demonstrates a session boundary only. Replace with real identity/authorization before production. */
export function makeDemoSessionMiddleware() {
    return os.$context<BaseContext>().middleware(async ({ context, next }) => {
        if (!context.demoSessionsEnabled) {
            throw new ORPCError('UNAUTHORIZED', {
                message: 'Demo sessions are disabled in production',
            });
        }
        const parsed = SessionToken.safeParse(context.headers.get('x-session-id'));
        if (!parsed.success) {
            throw new ORPCError('UNAUTHORIZED', { message: 'Valid demo session required' });
        }
        // Always check persisted state: a cached/injected session must not bypass revocation or expiry.
        const session = await createSessionService({ em: context.em }).getById(parsed.data);
        if (!session) {
            throw new ORPCError('UNAUTHORIZED', { message: 'Demo session expired or revoked' });
        }
        return next({
            context: { session, logger: context.logger.child({ demoSessionId: session.id }) },
        });
    });
}
