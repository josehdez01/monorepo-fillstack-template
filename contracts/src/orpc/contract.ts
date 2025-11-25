import { oc } from '@orpc/contract';
import { hello } from './hello/index.ts';
import { session } from './session/index.ts';
import { users } from './users/index.ts';

export const appContract = oc.router({
    hello,
    session,
    users,
});

export type AppContract = typeof appContract;
