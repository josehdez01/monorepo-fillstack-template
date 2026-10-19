import { oc } from '@orpc/contract';
import { z } from 'zod';
import { entityId } from '../../utils/entity-id.ts';

export const create = oc
    .input(z.object({ email: z.email().trim().toLowerCase().max(254) }))
    .output(z.object({ email: z.email().trim().toLowerCase().max(254), id: entityId('User') }))
    .errors({
        CONFLICT: { data: z.object({ field: z.literal('email') }) },
        UNAUTHORIZED: {
            data: z.undefined(),
        },
    });
