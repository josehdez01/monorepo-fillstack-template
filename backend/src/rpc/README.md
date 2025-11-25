ORPC Architecture and Patterns

This backend exposes application features via ORPC mounted under `/rpc`. Hono is used as the transport layer for health checks and external webhooks.

Directory Layout

- contracts/src/orpc/users/create.ts — contract (input/output/errors)
- contracts/src/orpc/users/get-by-id.ts — contract
- contracts/src/orpc/users/index.ts — namespace aggregator
- contracts/src/orpc/contract.ts — root aggregator
- backend/src/rpc/routers/\*.ts — handlers per namespace
- backend/src/rpc/routers/index.ts — root implementer + shared middlewares
- backend/src/rpc/middleware/\*.ts — auth + AppError mapping
- backend/src/modules/users/service.ts — feature service (orchestrates repos)
- backend/src/db/\*\* — data layer (entities, repositories, ORM)

Error Strategy

- Throw `AppError` from services (`ValidationError`, `NotFoundError`, etc.).
- Map to `ORPCError` centrally at the router level via the preconfigured implementer (deduped automatically).

Contract Example (users.create)

```ts
// contracts/src/orpc/users/create.ts
import { oc } from '@orpc/contract';
import { z } from 'zod';
import { entityId } from '../../utils/entity-id.ts';

export const create = oc
    .input(z.object({ email: z.string().email() }))
    .output(z.object({ id: entityId('User'), email: z.string().email() }))
    .errors({
        VALIDATION_ERROR: { data: z.object({ field: z.string().optional() }).optional() },
    });
```

Implementer + Handler Example

```ts
// backend/src/rpc/routers/users.ts
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
        users: os.router({ create, getById }),
    } as const;
}
```

Service Example

```ts
// backend/src/modules/users/service.ts
export function createUsersService({ em }: { em: EntityManager }) {
    const repo = createUserRepository(em);
    return {
        async create({ email }: { email: string }) {
            return toDTO(await repo.create({ email }));
        },
        async getById(id: User['id']) {
            const u = await repo.getById(id);
            if (!u) throw new NotFoundError('User not found');
            return toDTO(u);
        },
    };
}
```

Tips

- Keep handlers thin and pure: validation at the edge (contracts), orchestration in services.
- Pass the per-request `EntityManager` via `RpcContext` and never use global state in services.
- Keep all data code under `backend/src/db/*.ts` for a single place to reason about persistence.
- For auth, use `makeAuthMiddleware(base, getUser)` to populate `context.user` once and rely on built-in dedupe when composed at router and procedure levels.
