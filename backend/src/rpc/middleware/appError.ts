import { ORPCError, os } from '@orpc/server';
import { AppError } from '../../errors/app-errors.ts';

export function makeAppErrorMiddleware() {
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
