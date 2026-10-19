import type {
    EntityManager,
    EntitySchema,
    RequiredEntityData,
    FilterQuery,
    EntityRepository,
} from '@mikro-orm/core';

export function createBaseRepository<T extends { id: unknown }>(
    em: EntityManager,
    entity: EntitySchema<T>,
) {
    const repo = em.getRepository(entity) as EntityRepository<T>;

    return {
        async getById(id: T['id']): Promise<T | null> {
            return await repo.findOne({ id } as FilterQuery<T>);
        },

        async create(data: RequiredEntityData<T>): Promise<T> {
            const instance = repo.create(data);
            em.persist(instance);
            await em.flush();
            return instance;
        },

        async deleteById(id: T['id']): Promise<void> {
            const instance = await repo.findOne({ id } as FilterQuery<T>);
            if (instance) {
                em.remove(instance);
                await em.flush();
            }
        },

        // Expose the underlying repo for custom queries if needed,
        // though ideally we wrap everything.
        repository: repo,
    };
}
