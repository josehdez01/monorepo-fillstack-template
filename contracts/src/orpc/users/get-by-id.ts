import { oc } from '@orpc/contract';
import { z } from 'zod';

export const getById = oc
    .input(z.object({ id: z.number().int().positive() }))
    .output(z.object({ email: z.string().email(), id: z.number().int().positive() }))
    .errors({
        NOT_FOUND: { data: z.undefined() },
        UNAUTHORIZED: { data: z.undefined() },
    });
