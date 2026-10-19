import { oc } from '@orpc/contract';
import { z } from 'zod';
export const revokeSession = oc
    .input(z.object({}))
    .output(z.object({ revoked: z.literal(true) }))
    .errors({ UNAUTHORIZED: { data: z.undefined() } });
