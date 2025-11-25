import { type EntityDTO, type EntityManager, wrap } from '@mikro-orm/core';
import { createUserRepository } from '../../db/repositories/user-repo.ts';
import type { User } from '../../db/entities/user.ts';
import { NotFoundError } from '../../errors/app-errors.ts';

export interface CreateUserInput {
    email: string;
}

type UserDTO = Pick<EntityDTO<User>, 'id' | 'email'>;

function toUserDTO(user: User): UserDTO {
    const plain = wrap(user).toPOJO();
    return { id: plain.id, email: plain.email };
}

export function createUsersService(deps: { em: EntityManager }) {
    const repo = createUserRepository(deps.em);

    return {
        async create(input: CreateUserInput): Promise<UserDTO> {
            const user = await repo.create({ email: input.email });
            return toUserDTO(user);
        },

        async getById(id: number): Promise<UserDTO> {
            const user = await repo.getById(id as unknown as User['id']);
            if (!user) {
                throw new NotFoundError('User not found');
            }
            return toUserDTO(user);
        },
    } as const;
}
