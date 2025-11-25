#!/usr/bin/env node
import { MikroORM } from '@mikro-orm/postgresql';
import ormConfig from '../../mikro-orm.config.ts';

async function main() {
    const orm = await MikroORM.init(ormConfig);
    try {
        const migrator = orm.getMigrator();
        await migrator.up();
        console.log('[migrations] Up completed');
    } finally {
        await orm.close(true);
    }
}

try {
    await main();
} catch (err) {
    console.error('[migrations] up error', err);
    process.exit(1);
}
