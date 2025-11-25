import type { EntityDTO, EntityManager } from '@mikro-orm/core';
import { createUserRepository } from '../../db/repositories/user-repo.ts';
import type { User } from '../../db/entities/user.ts';
import { NotFoundError } from '../../errors/app-errors.ts';

export interface CreateUserInput {
    email: string;
}

export function createUsersService(deps: { em: EntityManager }) {
    const repo = createUserRepository(deps.em);

    return {
        async create(input: CreateUserInput): Promise<EntityDTO<User>> {
            const user = await repo.create({ email: input.email });
            return user;
        },

        async getById(id: number): Promise<EntityDTO<User>> {
            const user = await repo.getById(id as unknown as User['id']);
            if (!user) {
                throw new NotFoundError('User not found');
            }
            return user;
        },
    } as const;
}
