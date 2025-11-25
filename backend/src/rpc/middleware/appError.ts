import { ORPCError, type implement } from '@orpc/server';
import type { AppContract } from '@template/contracts/orpc/contract';
import { AppError } from '../../errors/app-errors.ts';
import type { BaseContext } from '../contexts/baseContext.ts';

export function makeAppErrorMiddleware(os: ReturnType<typeof implement<AppContract, BaseContext>>) {
    return os.middleware(async ({ next }) => {
        try {
            return await next();
        } catch (err: unknown) {
            if (err instanceof AppError) {
                throw new ORPCError(err.code, {
                    message: err.message,
                    status: err.statusCode,
                    data: err.data,
                    defined: true,
                });
            }
            throw err;
        }
    });
}
