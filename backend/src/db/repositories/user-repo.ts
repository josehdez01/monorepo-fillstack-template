import type { EntityManager } from '@mikro-orm/core';
import { UserModel } from '../entities/user.ts';
import { ValidationError } from '../../errors/app-errors.ts';
import { createBaseRepository } from './base-repo.ts';

export type UserRepository = ReturnType<typeof createUserRepository>;

export function createUserRepository(em: EntityManager) {
    const base = createBaseRepository(em, UserModel.entity);

    return {
        ...base,
        async findByEmail(email: string) {
            return await base._repo.findOne({ email });
        },
        // Override create to add validation
        async create(input: { email: string }) {
            const existing = await base._repo.findOne({ email: input.email });
            if (existing) {
                throw new ValidationError('Email already taken', 'email');
            }
            return base.create(input);
        },
    };
}
