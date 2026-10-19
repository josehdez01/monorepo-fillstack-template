import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { createNodeEnv, loadEnvFiles } from '@template/env';
import { backendEnvDefaults, backendTestEnvDefaults } from '../../../infra/env/defaults.ts';

const EnvSchema = {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    TRUST_PROXY: z
        .enum(['true', 'false'])
        .default('false')
        .transform((value) => value === 'true'),
    HOST: z.string().min(1).default('0.0.0.0'),
    QUEUE_PREFIX: z
        .string()
        .regex(/^[a-zA-Z0-9_-]+$/)
        .default('template-queues'),
    CORS_ORIGINS: z
        .string()
        .default('')
        .transform((value) =>
            value
                .split(',')
                .map((origin) => origin.trim())
                .filter(Boolean),
        )
        .pipe(z.array(z.url())),
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
    if (mode === 'development') {
        loadEnvFiles(['.env.local', '.env'], { cwd: backendDir });
    }
    envFilesLoaded = true;
}

export function getEnv(): Env {
    if (cached) {
        return cached;
    }
    ensureEnvFilesLoaded();
    const mode = process.env.NODE_ENV ?? 'development';
    const defaults =
        mode === 'production'
            ? { NODE_ENV: 'production' as const, PORT: 3000, ROLE: 'all' as const }
            : mode === 'test'
              ? backendTestEnvDefaults
              : {
                    ...backendEnvDefaults,
                    CORS_ORIGINS:
                        'http://localhost:5173,http://localhost:5174,http://localhost:5175',
                };
    cached = createNodeEnv(EnvSchema, { defaults });
    return cached;
}

export function resetEnvCache(): void {
    cached = undefined;
    envFilesLoaded = false;
}
