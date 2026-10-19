import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { type ZodIssue, z } from 'zod';

export type EnvShape<Schema extends z.ZodTypeAny> = z.infer<Schema>;

export interface LoadEnvFilesOptions {
    cwd?: string;
    override?: boolean;
}

export function loadEnvFile(path: string, options: LoadEnvFilesOptions = {}): void {
    const { cwd = process.cwd(), override = false } = options;
    const abs = resolve(cwd, path);
    if (!existsSync(abs)) {
        return;
    }
    // Match Node's .env semantics: comments, export prefixes, quoted # and multiline values.
    for (const [key, val] of Object.entries(parseEnv(readFileSync(abs, 'utf8')))) {
        if (!override && Object.prototype.hasOwnProperty.call(process.env, key)) {
            continue;
        }
        process.env[key] = val;
    }
}

export function loadEnvFiles(paths: string[], options: LoadEnvFilesOptions = {}): void {
    for (const p of paths) {
        loadEnvFile(p, options);
    }
}

export interface CreateNodeEnvOptions {
    defaults?: Record<string, unknown>;
    env?: NodeJS.ProcessEnv | Record<string, unknown>;
}

export const createNodeEnv = <Shape extends z.ZodRawShape>(
    shape: Shape,
    options: CreateNodeEnvOptions = {},
): EnvShape<z.ZodObject<Shape>> => {
    const schema = z.object(shape);
    const { defaults = {}, env: envSource } = options;
    let env: NodeJS.ProcessEnv | Record<string, unknown> = envSource ?? {};
    if (!envSource && typeof process !== 'undefined' && process.env) {
        env = process.env;
    }
    const parsed = schema.safeParse({ ...defaults, ...env });
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
            .join(', ');
        throw new Error(`Invalid environment: ${issues}`);
    }
    return parsed.data;
};

export const parseNodeEnv = <Shape extends z.ZodRawShape>(
    shape: Shape,
): EnvShape<z.ZodObject<Shape>> => {
    return createNodeEnv(shape);
};
