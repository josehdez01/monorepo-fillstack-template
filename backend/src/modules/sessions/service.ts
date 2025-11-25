import type { EntityDTO, EntityManager } from '@mikro-orm/core';
import { SessionModel, type Session } from '../../db/entities/session.ts';

export interface CreateSessionInput {
    type: 'user' | 'system';
    ipAddress?: string;
    userAgent?: string;
}

export function createSessionService(deps: { em: EntityManager }) {
    const repo = deps.em.getRepository(SessionModel.entity);

    return {
        async create(input: CreateSessionInput): Promise<EntityDTO<Session>> {
            const session = repo.create({
                sessionId: crypto.randomUUID(),
                type: input.type,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
            });
            await deps.em.persistAndFlush(session);
            return session;
        },

        async getById(id: string): Promise<EntityDTO<Session> | null> {
            return await repo.findOne({ sessionId: id });
        },
    } as const;
}
