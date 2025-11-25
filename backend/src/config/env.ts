import { z } from 'zod';

const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z
        .string()
        .transform((v) => (v === undefined || v === '' ? undefined : Number(v)))
        .pipe(z.number().int().positive().max(65535))
        .default(3000),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
    if (cached) {
        return cached;
    }
    const parsed = EnvSchema.safeParse(process.env);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join(', ');
        throw new Error(`Invalid environment: ${issues}`);
    }
    cached = parsed.data;
    return cached;
}
