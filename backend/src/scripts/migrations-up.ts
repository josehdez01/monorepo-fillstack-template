#!/usr/bin/env node
import { MikroORM } from '@mikro-orm/postgresql';
import ormConfig from '../../mikro-orm.config.ts';

async function main() {
    const orm = await MikroORM.init(ormConfig);
    try {
        const migrator = orm.getMigrator();
        await migrator.up();
        // eslint-disable-next-line no-console
        console.log('[migrations] Up completed');
    } finally {
        await orm.close(true);
    }
}

try {
    await main();
} catch (err) {
    // eslint-disable-next-line no-console
    console.error('[migrations] up error', err);
    process.exit(1);
}
