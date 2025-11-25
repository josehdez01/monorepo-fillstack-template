#!/usr/bin/env node
import { MikroORM } from '@mikro-orm/postgresql';
import ormConfig from '../../mikro-orm.config.ts';

async function main() {
    const orm = await MikroORM.init(ormConfig);
    try {
        const migrator = orm.getMigrator();
        await migrator.down();
        // eslint-disable-next-line no-console
        console.log('[migrations] Down completed');
    } finally {
        await orm.close(true);
    }
}

try {
    await main();
} catch (err) {
    // eslint-disable-next-line no-console
    console.error('[migrations] down error', err);
    process.exit(1);
}
