import { type ZodIssue, z } from 'zod';

declare global {
    interface ImportMeta {
        readonly env?: Record<string, unknown>;
    }
}

export type ViteEnvShape<Schema extends z.ZodTypeAny> = z.infer<Schema>;

// Use inside Vite apps to validate VITE_* variables at runtime
export const parseViteEnv = <Shape extends z.ZodRawShape>(
    shape: Shape,
): ViteEnvShape<z.ZodObject<Shape>> => {
    const schema = z.object(shape);
    // Vite exposes import.meta.env as a plain object; pick only relevant keys
    const raw: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) {
        raw[key] = import.meta.env?.[key];
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
            .join(', ');
        throw new Error(`Invalid Vite environment: ${issues}`);
    }
    return parsed.data;
};
