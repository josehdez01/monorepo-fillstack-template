#!/usr/bin/env node
import { MikroORM } from '@mikro-orm/postgresql';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { generateMigrationRegistry } from './migrations-registry.ts';
import { createOrmConfig } from '../../mikro-orm.config.ts';

async function main() {
    const orm = await MikroORM.init(createOrmConfig());
    try {
        const migrator = orm.migrator;
        // If no migrations/snapshot exist yet, create an initial migration; otherwise, create a diff.
        const dir = path.resolve('migrations');
        let hasExisting = false;
        try {
            const files = await fs.readdir(dir);
            hasExisting = files.some(
                (f) => f.startsWith('Migration') || f.startsWith('.snapshot-'),
            );
        } catch {}

        const res = hasExisting ? await migrator.create() : await migrator.createInitial();
        if (!res.fileName) {
            console.log('[migrations] No changes detected.');
        } else {
            await generateMigrationRegistry();
            console.log(`[migrations] Created: ${res.fileName}`);
        }
    } finally {
        await orm.close(true);
    }
}

try {
    await main();
} catch (err) {
    console.error('[migrations] error', err);
    process.exit(1);
}
