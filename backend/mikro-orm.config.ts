import { defineConfig } from '@mikro-orm/postgresql';
import { UnderscoreNamingStrategy } from '@mikro-orm/core';
import { getEnv } from './src/config/env.ts';
import { entities } from './src/db/entities/registry.gen.ts';

const env = getEnv();

export default defineConfig({
    clientUrl: env.DATABASE_URL,
    // Use explicit registry to avoid discovery pitfalls across envs
    entities: [...entities],
    namingStrategy: UnderscoreNamingStrategy,
    schemaGenerator: { createForeignKeyConstraints: false },
    migrations: { path: './migrations', glob: '!(*.d).{js,ts}' },
    discovery: { warnWhenNoEntities: true },
});
