import { oc } from '@orpc/contract';
import { z } from 'zod';
import { entityId } from '../../utils/entity-id.ts';

export const create = oc
    .input(z.object({ email: z.string().email() }))
    .output(z.object({ email: z.string().email(), id: entityId('User') }))
    .errors({
        VALIDATION_ERROR: {
            // ValidationError data may include an optional field name
            data: z.object({ field: z.string().optional() }).optional(),
        },
        UNAUTHORIZED: {
            data: z.undefined(),
        },
    });
