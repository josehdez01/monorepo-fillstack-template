import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { createNodeEnv, loadEnvFiles } from '@template/env';
import { backendEnvDefaults, backendTestEnvDefaults } from '../../../infra/env/defaults.ts';

const EnvSchema = {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().max(65535).default(3000),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    ROLE: z.enum(['api', 'worker', 'all']).default('all'),
} satisfies z.ZodRawShape;

export type Env = z.infer<z.ZodObject<typeof EnvSchema>>;

let cached: Env | undefined;
let envFilesLoaded = false;
const backendDir = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

function ensureEnvFilesLoaded() {
    if (envFilesLoaded) {
        return;
    }
    const mode = process.env.NODE_ENV ?? 'development';
    if (mode === 'test') {
        loadEnvFiles(['.env.test.local', '.env.test', '.env.local', '.env'], { cwd: backendDir });
    } else {
        loadEnvFiles(['.env.local', '.env'], { cwd: backendDir });
    }
    envFilesLoaded = true;
}

export function getEnv(): Env {
    if (cached) {
        return cached;
    }
    ensureEnvFilesLoaded();
    const defaults =
        (process.env.NODE_ENV ?? 'development') === 'test'
            ? backendTestEnvDefaults
            : backendEnvDefaults;
    cached = createNodeEnv(EnvSchema, { defaults });
    return cached;
}

export function resetEnvCache(): void {
    cached = undefined;
    envFilesLoaded = false;
}
