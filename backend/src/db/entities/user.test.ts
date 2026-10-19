import { UniqueConstraintViolationException, type EntityManager } from '@mikro-orm/core';
import { describe, it, expect, vi } from 'vitest';
import type { User } from './user.ts';
import { createUserRepository } from '../repositories/user-repo.ts';

function fixture() {
    const user = {
        id: 1 as User['id'],
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const repository = {
        findOne: vi.fn().mockResolvedValue(user),
        create: vi.fn().mockReturnValue(user),
    };
    const manager = {
        getRepository: () => repository,
        persist: vi.fn(),
        flush: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn(),
    };
    return {
        user,
        repository,
        manager,
        service: createUserRepository(manager as unknown as EntityManager),
    };
}
describe('user repository', () => {
    it('fetches by the branded identifier and preserves database results', async () => {
        const { service, user, repository } = fixture();
        expect(await service.getById(user.id)).toBe(user);
        expect(repository.findOne).toHaveBeenCalledWith({ id: user.id });
    });
    it('canonicalizes writes and flushes through MikroORM7 explicitly', async () => {
        const { service, user, repository, manager } = fixture();
        expect(await service.create({ email: ' TEST@EXAMPLE.COM ' })).toBe(user);
        expect(repository.create).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(manager.persist).toHaveBeenCalledWith(user);
        expect(manager.flush).toHaveBeenCalledOnce();
        expect(repository.findOne).not.toHaveBeenCalled();
    });
    it('maps database uniqueness races to the declared domain conflict', async () => {
        const { service, manager } = fixture();
        manager.flush.mockRejectedValueOnce(
            new UniqueConstraintViolationException(new Error('duplicate key')),
        );
        await expect(service.create({ email: 'test@example.com' })).rejects.toMatchObject({
            code: 'CONFLICT',
            statusCode: 409,
            data: { field: 'email' },
        });
    });
    it('preserves unrelated database failures for infrastructure reporting', async () => {
        const { service, manager } = fixture();
        const failure = new Error('database unavailable');
        manager.flush.mockRejectedValueOnce(failure);
        await expect(service.create({ email: 'test@example.com' })).rejects.toBe(failure);
    });
});
