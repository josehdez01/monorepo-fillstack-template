import { type ZodIssue, z } from 'zod';

export type EnvShape<Schema extends z.ZodTypeAny> = z.infer<Schema>;

export const parseNodeEnv = <Shape extends z.ZodRawShape>(
    shape: Shape,
): EnvShape<z.ZodObject<Shape>> => {
    const schema = z.object(shape);
    let env: NodeJS.ProcessEnv | Record<string, never> = {};
    if (typeof process !== 'undefined') {
        const { env: processEnv } = process;
        if (processEnv) {
            env = processEnv;
        }
    }
    const parsed = schema.safeParse(env);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
            .join(', ');
        throw new Error(`Invalid environment: ${issues}`);
    }
    return parsed.data;
};
