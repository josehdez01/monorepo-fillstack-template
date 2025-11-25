ORPC Architecture and Patterns

This backend exposes application features via ORPC mounted under `/rpc`. Hono is used as the transport layer for health checks and external webhooks.

Directory Layout

- contracts/src/orpc/users/create.ts — contract (input/output/errors)
- contracts/src/orpc/users/get-by-id.ts — contract
- contracts/src/orpc/users/index.ts — namespace aggregator
- contracts/src/orpc/contract.ts — root aggregator
- backend/src/rpc/users.ts — handlers per namespace
- backend/src/rpc/base.ts — preconfigured implementer (context + shared middlewares)
- backend/src/rpc/auth.ts — dedupe-friendly auth middleware factory
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

export const create = oc
    .input(z.object({ email: z.string().email() }))
    .output(z.object({ id: z.number().int().positive(), email: z.string().email() }))
    .errors({
        VALIDATION_ERROR: { data: z.object({ field: z.string().optional() }).optional() },
    });
```

Implementer + Handler Example

```ts
// backend/src/rpc/base.ts
export function createRpcImplementer() {
    const os0 = implement<AppContract>(appContract);
    const os = os0.$context<RpcContext>();
    const appErrorToOrpc = makeAppErrorMiddleware(os);
    const base = os.use(appErrorToOrpc);
    return { os, base };
}

// backend/src/rpc/users.ts
export function buildUsers(os: ReturnType<typeof implement<AppContract>>) {
    const create = os.users.create.$context<RpcContext>().handler(async ({ input, context }) => {
        const svc = createUsersService({ em: context.em });
        return await svc.create({ email: input.email });
    });

    const getById = os.users.getById.$context<RpcContext>().handler(async ({ input, context }) => {
        const svc = createUsersService({ em: context.em });
        return await svc.getById(input.id);
    });

    return { users: { create, getById } } as const;
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
        async getById(id: number) {
            const u = await repo.getById(id as unknown as User['id']);
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
