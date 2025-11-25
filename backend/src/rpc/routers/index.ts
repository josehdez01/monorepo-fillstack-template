import { appContract } from '@template/contracts/orpc/contract';
import type { BaseContext } from '../contexts/baseContext.ts';
import { implement } from '@orpc/server';
import { buildHello } from './hello.ts';
import { buildSession } from './session.ts';
import { buildUsers } from './users.ts';
import { makeAppErrorMiddleware } from '../middleware/appError.ts';

const os = implement(appContract).$context<BaseContext>();

export const router = os.use(makeAppErrorMiddleware()).router({
    ...buildHello(),
    ...buildUsers(),
    ...buildSession(),
});
