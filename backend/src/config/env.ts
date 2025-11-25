import { z } from 'zod';
import { parseNodeEnv } from '@template/env';

const EnvSchema = {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z
        .string()
        .transform((v) => (v === undefined || v === '' ? undefined : Number(v)))
        .pipe(z.number().int().positive().max(65535))
        .default(3000),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    ROLE: z.enum(['api', 'worker', 'all']).default('all'),
} satisfies z.ZodRawShape;

export type Env = z.infer<z.ZodObject<typeof EnvSchema>>;

let cached: Env | undefined;

export function getEnv(): Env {
    if (cached) {
        return cached;
    }
    cached = parseNodeEnv(EnvSchema);
    return cached;
}
