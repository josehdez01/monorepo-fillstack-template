import { parseViteEnv } from '@template/env';
import { z } from 'zod';

const PublicEnvSchema = {
    VITE_RPC_URL: z.url().default('http://localhost:3000'),
    VITE_ORPC_VALIDATE_REQUESTS: z.coerce.boolean().default(true),
} as const;

export type PublicEnv = z.infer<z.ZodObject<typeof PublicEnvSchema>>;

export function getPublicEnv(): PublicEnv {
    return parseViteEnv(PublicEnvSchema);
}
