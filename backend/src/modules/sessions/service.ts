import { type EntityDTO, type EntityManager, wrap } from '@mikro-orm/core';
import { SessionModel, type Session } from '../../db/entities/session.ts';

export const DEMO_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export interface CreateSessionInput {
    type: 'user' | 'system';
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}

/** Demo bearer sessions are not user authentication or authorization. */
export function createSessionService(deps: { em: EntityManager; now?: () => Date }) {
    const repo = deps.em.getRepository(SessionModel.entity);
    const now = deps.now ?? (() => new Date());
    return {
        async create(input: CreateSessionInput): Promise<EntityDTO<Session>> {
            const session = repo.create({
                sessionId: crypto.randomUUID(),
                type: input.type,
                ipAddress: input.ipAddress ?? null,
                userAgent: input.userAgent ?? null,
                expiresAt: new Date(now().getTime() + DEMO_SESSION_TTL_MS),
                revokedAt: null,
            });
            deps.em.persist(session);
            await deps.em.flush();
            return wrap(session).toPOJO();
        },
        async getById(sessionId: string): Promise<EntityDTO<Session> | null> {
            const session = await repo.findOne({
                sessionId,
                revokedAt: null,
                expiresAt: { $gt: now() },
            });
            return session ? wrap(session).toPOJO() : null;
        },
        async revoke(sessionId: string): Promise<void> {
            await deps.em.nativeUpdate(
                SessionModel.entity,
                { sessionId, revokedAt: null },
                { revokedAt: now() },
            );
        },
    } as const;
}
