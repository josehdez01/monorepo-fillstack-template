import type { User } from './user.ts';
import type { EntityManager } from '@mikro-orm/core';
import { createUserRepository } from '../repositories/user-repo.ts';
import { describe, it, expect, vi } from 'vitest';

describe('User Entity and Repository', () => {
    it('should have correct types', () => {
        // Type-only checks (will fail compilation if wrong)
        const user: User = {
            id: 1 as User['id'],
            email: 'test@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        expect(user.email).toBeTypeOf('string');
    });

    it('should create user repository and find user', async () => {
        const mockRepo = {
            findOne: vi.fn(),
            create: vi.fn(),
            persistAndFlush: vi.fn(),
            removeAndFlush: vi.fn(),
        };
        const mockEm = {
            getRepository: () => mockRepo,
            persistAndFlush: vi.fn(),
            removeAndFlush: vi.fn(),
        } as unknown as EntityManager;

        const repo = createUserRepository(mockEm);

        const userId = 1 as User['id'];
        mockRepo.findOne.mockResolvedValue({ id: userId, email: 'test@example.com' });

        const user = await repo.getById(userId);
        expect(user).toBeDefined();
        expect(user?.id).toBe(userId);
    });
});
