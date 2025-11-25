import { type EntityDTO, type EntityManager, wrap } from '@mikro-orm/core';
import { SessionModel, type Session } from '../../db/entities/session.ts';

export interface CreateSessionInput {
    type: 'user' | 'system';
    ipAddress?: string;
    userAgent?: string;
}

const toSessionDTO = (session: Session) => {
    const plain = wrap(session).toPOJO();
    return {
        id: plain.id,
        sessionId: plain.sessionId,
        type: plain.type,
        ipAddress: plain.ipAddress,
        userAgent: plain.userAgent,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
    };
};

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
            return toSessionDTO(session);
        },

        async getById(id: string): Promise<EntityDTO<Session> | null> {
            const session = await repo.findOne({ sessionId: id });
            return session ? toSessionDTO(session) : null;
        },
    } as const;
}
