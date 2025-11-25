import { oc } from '@orpc/contract';
import { z } from 'zod';

export const create = oc
    .input(z.object({ email: z.string().email() }))
    .output(z.object({ email: z.string().email(), id: z.number().int().positive() }))
    .errors({
        VALIDATION_ERROR: {
            // ValidationError data may include an optional field name
            data: z.object({ field: z.string().optional() }).optional(),
        },
    });
