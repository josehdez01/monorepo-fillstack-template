import { z } from 'zod';

const PublicEnvSchema = z.object({
    VITE_RPC_URL: z.string().url().default('http://localhost:3000'),
    VITE_ORPC_VALIDATE_REQUESTS: z.coerce.boolean().default(false),
});

export type PublicEnv = z.infer<typeof PublicEnvSchema>;

export function getPublicEnv(): PublicEnv {
    const parsed = PublicEnvSchema.safeParse(import.meta.env);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join(', ');
        throw new Error(`Invalid public env: ${issues}`);
    }
    return parsed.data;
}
