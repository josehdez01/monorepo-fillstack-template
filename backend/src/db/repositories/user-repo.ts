import { UniqueConstraintViolationException, type EntityManager } from '@mikro-orm/core';
import { UserModel } from '../entities/user.ts';
import { ConflictError } from '../../errors/app-errors.ts';
import { createBaseRepository } from './base-repo.ts';

export type UserRepository = ReturnType<typeof createUserRepository>;
export function createUserRepository(em: EntityManager) {
    const base = createBaseRepository(em, UserModel.entity);
    return {
        ...base,
        async findByEmail(email: string) {
            return base.repository.findOne({ email });
        },
        async create(input: { email: string }) {
            // The database unique constraint resolves concurrent requests atomically.
            try {
                return await base.create({ email: input.email.trim().toLowerCase() });
            } catch (error) {
                if (error instanceof UniqueConstraintViolationException) {
                    throw new ConflictError('Email already taken', 'email');
                }
                throw error;
            }
        },
    };
}
