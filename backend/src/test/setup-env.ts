import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(path: string) {
    try {
        const abs = resolve(path);
        const content = readFileSync(abs, 'utf8');
        for (const line of content.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }
            const eq = trimmed.indexOf('=');
            if (eq === -1) {
                continue;
            }
            const key = trimmed.slice(0, eq).trim();
            let val = trimmed.slice(eq + 1).trim();
            if (
                (val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))
            ) {
                val = val.slice(1, -1);
            }
            if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
                process.env[key] = val;
            }
        }
    } catch {
        // ignore
    }
}

if (existsSync('.env.test.local')) {
    loadEnvFile('.env.test.local');
} else if (existsSync('.env.test')) {
    loadEnvFile('.env.test');
} else if (existsSync('.env')) {
    loadEnvFile('.env');
}

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
}

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/monorepo_test';
}

if (!process.env.REDIS_URL) {
    process.env.REDIS_URL = 'redis://localhost:6379';
}

if (!process.env.ROLE) {
    process.env.ROLE = 'all';
}
