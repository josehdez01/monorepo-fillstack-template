import { oc } from '@orpc/contract';
import { createSession } from './create-session.ts';
import { revokeSession } from './revoke-session.ts';
export const session = oc.router({ createSession, revokeSession });
