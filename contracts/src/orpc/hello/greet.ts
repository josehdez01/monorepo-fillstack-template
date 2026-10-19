import { oc } from '@orpc/contract';
import { z } from 'zod';

const MIN_NAME_LENGTH = 1;
const MIN_RETRY_AFTER = 1;

export const greet = oc
    .input(z.object({ name: z.string().trim().min(MIN_NAME_LENGTH).max(100) }))
    .output(z.string())
    .errors({
        VALIDATION_ERROR: { data: z.object({ field: z.string().optional() }).optional() },
        RATE_LIMITED: {
            data: z.object({ retryAfter: z.number().int().min(MIN_RETRY_AFTER) }),
        },
        UNAUTHORIZED: {
            data: z.undefined(),
        },
    });
