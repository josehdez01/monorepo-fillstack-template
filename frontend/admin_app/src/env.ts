import { z } from 'zod';

const PublicEnvSchema = z.object({
    VITE_API_BASE_URL: z.string().url().optional(),
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
