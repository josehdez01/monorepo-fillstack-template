import { oc } from '@orpc/contract';
import { z } from 'zod';

export const createSession = oc
    .input(
        z.object({
            userAgent: z.string().max(1024).optional(),
        }),
    )
    .output(
        z.object({
            sessionId: z.uuid(),
        }),
    )
    .errors({ FORBIDDEN: { data: z.undefined() } });
