import { oc } from '@orpc/contract';
import { z } from 'zod';
import { entityId } from '../../utils/entity-id.ts';

export const getById = oc
    .input(z.object({ id: entityId('User') }))
    .output(z.object({ email: z.string().email(), id: entityId('User') }))
    .errors({
        NOT_FOUND: { data: z.undefined() },
        UNAUTHORIZED: { data: z.undefined() },
    });
