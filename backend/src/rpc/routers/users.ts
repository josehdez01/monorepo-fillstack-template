import { implement } from '@orpc/server';
import { appContract } from '@template/contracts/orpc/contract';
import { createUsersService } from '../../modules/users/service.ts';
import { makeAuthMiddleware } from '../middleware/auth.ts';
import type { BaseContext } from '../contexts/baseContext.ts';

export function buildUsers() {
    const os = implement(appContract.users).$context<BaseContext>().use(makeAuthMiddleware());

    const create = os.create.handler(async ({ input, context }) => {
        const svc = createUsersService({ em: context.em });
        return await svc.create({ email: input.email });
    });

    const getById = os.getById.handler(async ({ input, context }) => {
        const svc = createUsersService({ em: context.em });
        return await svc.getById(input.id);
    });

    return {
        users: os.router({
            create,
            getById,
        }),
    } as const;
}
