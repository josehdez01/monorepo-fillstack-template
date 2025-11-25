import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFiles } from '@template/env';
import { backendEnvDefaults, backendTestEnvDefaults } from '../../../infra/env/defaults.ts';

const backendDir = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

// Load test-specific env files first; fall back to dev/local envs.
loadEnvFiles(['.env.test.local', '.env.test', '.env.local', '.env'], { cwd: backendDir });

const testDefaults = backendTestEnvDefaults;
const fallbackDefaults = backendEnvDefaults;

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
}

const portDefault = testDefaults.PORT ?? fallbackDefaults.PORT;
if (!process.env.PORT && portDefault !== undefined) {
    process.env.PORT = String(portDefault);
}

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
        process.env.TEST_DATABASE_URL ?? testDefaults.DATABASE_URL ?? fallbackDefaults.DATABASE_URL;
}

if (!process.env.REDIS_URL) {
    process.env.REDIS_URL = testDefaults.REDIS_URL ?? fallbackDefaults.REDIS_URL;
}

if (!process.env.ROLE) {
    process.env.ROLE = testDefaults.ROLE ?? fallbackDefaults.ROLE ?? 'all';
}
