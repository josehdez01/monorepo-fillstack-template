import { z } from 'zod';

export type ViteEnvShape<Schema extends z.ZodTypeAny> = z.infer<Schema>;

// Use inside Vite apps to validate VITE_* variables at runtime
export const parseViteEnv = <Shape extends z.ZodRawShape>(
    shape: Shape,
): ViteEnvShape<z.ZodObject<Shape>> => {
    const schema = z.object(shape);
    // Vite exposes import.meta.env as a plain object; pick only relevant keys
    const raw: Record<string, unknown> = {};
    const envSource = (import.meta as { env?: Record<string, unknown> }).env ?? {};
    for (const key of Object.keys(shape)) {
        raw[key] = envSource[key];
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
