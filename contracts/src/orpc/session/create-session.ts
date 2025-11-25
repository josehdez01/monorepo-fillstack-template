import { oc } from '@orpc/contract';
import { z } from 'zod';

export const createSession = oc
    .input(
        z.object({
            userAgent: z.string().optional(),
        }),
    )
    .output(
        z.object({
            sessionId: z.string(),
        }),
    )
    .errors({
        DUMMY_ERROR: {
            data: z.object({ message: z.string() }),
        },
    });
