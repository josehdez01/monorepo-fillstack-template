#!/usr/bin/env node
import path from 'node:path';
import { z } from 'zod';
import { loadEnvFiles } from '@template/env';
import {
    backendEnvDefaults,
    backendTestEnvDefaults,
    frontendEnvDefaults,
} from '../../infra/env/defaults.ts';

type CheckResult =
    | { name: string; mode?: string; ok: true; details: string }
    | { name: string; mode?: string; ok: false; error: string };

function withIsolatedEnv<T>(fn: () => Promise<T>): Promise<T> {
    const snapshot = { ...process.env };
    return fn().finally(() => {
        for (const key of Object.keys(process.env)) {
            delete process.env[key];
        }
        Object.assign(process.env, snapshot);
    });
}

async function checkBackend(mode: 'development' | 'test'): Promise<CheckResult> {
    return await withIsolatedEnv(async () => {
        const cwd = path.resolve('backend');
        const prevCwd = process.cwd();
        process.chdir(cwd);
        if (mode === 'test') {
            process.env.NODE_ENV = 'test';
        } else {
            process.env.NODE_ENV = 'development';
        }

        const envFiles =
            mode === 'test'
                ? ['.env.test.local', '.env.test', '.env.local', '.env']
                : ['.env.local', '.env'];
        loadEnvFiles(envFiles, { cwd });

        if (mode === 'test' && process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
            process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
        }

        try {
            const { getEnv, resetEnvCache } = await import('../../backend/src/config/env.ts');
            resetEnvCache?.();
            const env = getEnv();
            const defaults = mode === 'test' ? backendTestEnvDefaults : backendEnvDefaults;
            const db = env.DATABASE_URL ?? defaults.DATABASE_URL;
            const redis = env.REDIS_URL ?? defaults.REDIS_URL;
            return {
                name: 'backend',
                mode,
                ok: true,
                details: `DATABASE_URL=${db}, REDIS_URL=${redis}, NODE_ENV=${env.NODE_ENV}, ROLE=${env.ROLE}`,
            };
        } catch (err) {
            return {
                name: 'backend',
                mode,
                ok: false,
                error: err instanceof Error ? err.message : String(err),
            };
        } finally {
            process.chdir(prevCwd);
        }
    });
}

async function checkFrontend(name: string, dir: string): Promise<CheckResult> {
    return await withIsolatedEnv(async () => {
        const cwd = path.resolve(dir);
        const prevCwd = process.cwd();
        process.chdir(cwd);
        try {
            loadEnvFiles(['.env.local', '.env'], { cwd });

            const schema = z.object({
                VITE_RPC_URL: z.string().url(),
                VITE_ORPC_VALIDATE_REQUESTS: z.coerce.boolean(),
            });

            const parsed = schema.safeParse({
                VITE_RPC_URL: process.env.VITE_RPC_URL ?? frontendEnvDefaults.VITE_RPC_URL,
                VITE_ORPC_VALIDATE_REQUESTS:
                    process.env.VITE_ORPC_VALIDATE_REQUESTS ??
                    frontendEnvDefaults.VITE_ORPC_VALIDATE_REQUESTS,
            });

            if (!parsed.success) {
                const msgs = parsed.error.issues
                    .map((i) => `${i.path.join('.')}: ${i.message}`)
                    .join(', ');
                return { name, ok: false, error: msgs };
            }

            return {
                name,
                ok: true,
                details: `VITE_RPC_URL=${parsed.data.VITE_RPC_URL}, VITE_ORPC_VALIDATE_REQUESTS=${parsed.data.VITE_ORPC_VALIDATE_REQUESTS}`,
            };
        } finally {
            process.chdir(prevCwd);
        }
    });
}

async function main() {
    const results: CheckResult[] = [];

    results.push(await checkBackend('development'));
    results.push(await checkBackend('test'));
    results.push(await checkFrontend('frontend:landing_page', 'frontend/landing_page'));
    results.push(await checkFrontend('frontend:user_app', 'frontend/user_app'));
    results.push(await checkFrontend('frontend:admin_app', 'frontend/admin_app'));

    for (const res of results) {
        const label = res.mode ? `${res.name} (${res.mode})` : res.name;
        if (res.ok) {
            console.log(`[env:doctor] ${label}: OK — ${res.details}`);
        } else {
            console.error(`[env:doctor] ${label}: ERROR — ${res.error}`);
        }
    }

    const hadError = results.some((r) => !r.ok);
    process.exit(hadError ? 1 : 0);
}

main().catch((err) => {
    console.error('[env:doctor] unexpected error', err);
    process.exit(1);
});
