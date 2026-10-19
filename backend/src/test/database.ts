import { MikroORM } from '@mikro-orm/postgresql';
import { createOrmConfig } from '../../mikro-orm.config.ts';
import { TestDbManager } from './test-db.ts';

export async function createTestDatabase() {
    const manager = new TestDbManager();
    const { name, url } = await manager.createEphemeral();
    try {
        const orm = await MikroORM.init(createOrmConfig(url));
        return {
            orm,
            url,
            name,
            async close() {
                try {
                    await orm.close(true);
                } finally {
                    await manager.dropDatabase(name);
                }
            },
        };
    } catch (error) {
        await manager.dropDatabase(name);
        throw error;
    }
}
