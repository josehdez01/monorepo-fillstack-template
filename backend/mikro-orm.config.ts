import { fileURLToPath } from 'node:url';
import { defineConfig } from '@mikro-orm/postgresql';
import { UnderscoreNamingStrategy } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { getEnv } from './src/config/env.ts';
import { entities } from './src/db/entities/registry.gen.ts';
import { migrations } from './migrations/registry.gen.ts';

/** Explicit configuration prevents cached imports or process.env mutation from redirecting tests. */
export function createOrmConfig(clientUrl = getEnv().DATABASE_URL) {
    return defineConfig({
        clientUrl,
        entities: [...entities],
        namingStrategy: UnderscoreNamingStrategy,
        extensions: [Migrator],
        migrations: {
            path: fileURLToPath(new URL('./migrations', import.meta.url)),
            migrationsList: [...migrations],
            snapshotOnMigrate: false,
        },
    });
}

export default createOrmConfig;
