#!/usr/bin/env node
import { TestDbManager } from './test-db.ts';
import { getEnv } from '../config/env.ts';

const cmd = process.argv[2] || 'ensure';

async function main() {
    // Validate env and ensure template
    // Consumers may load env via setup-env or .env.test.local; here we just validate
    getEnv();
    // Retry a few times in case Postgres just started
    const mgr = new TestDbManager();
    const attempts = 10;
    const delay = 500;
    for (let i = 0; i < attempts; i++) {
        try {
            const name = await mgr.ensureTemplate(cmd === 'rebuild');
            console.log(`[test-db] Template ready: ${name}`);
            return;
        } catch (err) {
            if (i === attempts - 1) {
                throw err;
            }
            await new Promise((r) => setTimeout(r, delay));
        }
    }
}

try {
    await main();
} catch (err) {
    console.error('[test-db] error', err);
    process.exit(1);
}
