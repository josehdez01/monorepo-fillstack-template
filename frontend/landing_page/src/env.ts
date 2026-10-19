import { parseViteEnv } from '@template/env';
import { z } from 'zod';

const PublicEnvSchema = {
    VITE_USER_APP_URL: z.url().default('http://localhost:5175'),
    VITE_ADMIN_APP_URL: z.url().default('http://localhost:5174'),
    VITE_RPC_URL: z.string().url().default('http://localhost:3000'),
    VITE_ORPC_VALIDATE_REQUESTS: z.stringbool().default(true),
} as const;

export type PublicEnv = z.infer<z.ZodObject<typeof PublicEnvSchema>>;

export function getPublicEnv(): PublicEnv {
    return parseViteEnv(PublicEnvSchema, import.meta.env);
}
