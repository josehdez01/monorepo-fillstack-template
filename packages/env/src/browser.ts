import { z } from 'zod';

export type ViteEnvShape<Schema extends z.ZodTypeAny> = z.infer<Schema>;

// Use inside Vite apps to validate VITE_* variables at runtime
export const parseViteEnv = <Shape extends z.ZodRawShape>(
    shape: Shape,
    source: Record<string, unknown> = (import.meta as { env?: Record<string, unknown> }).env ?? {},
): ViteEnvShape<z.ZodObject<Shape>> => {
    const schema = z.object(shape);
    // Vite exposes import.meta.env as a plain object; pick only relevant keys
    const raw: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) {
        if (!key.startsWith('VITE_')) {
            throw new Error(`Public environment keys must start with VITE_: ${key}`);
        }
        raw[key] = source[key];
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((issue: z.core.$ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
            .join(', ');
        throw new Error(`Invalid Vite environment: ${issues}`);
    }
    return parsed.data;
};
