import type { BaseContext } from './baseContext.ts';
import type { Session } from '../../db/entities/session.ts';
import type { EntityDTO } from '@mikro-orm/core';

export interface RpcSessionContext extends BaseContext {
    session: EntityDTO<Session>;
}
