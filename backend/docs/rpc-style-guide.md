# RPC Style Guide

This repo uses ORPC contracts (Zod + contract router) with a modular, namespaced structure. Procedures are added explicitly (no codegen).

Principles

- Contract-first: Define Zod schemas and contract builders in `contracts/`; backend handlers must conform to the contract.
- Namespaces: Group related procedures under `contracts/src/orpc/<ns>/` and `backend/src/rpc/<ns>.ts`.
- Typed context: Use `backend/src/rpc/context.ts` to access request-scoped logger, ORM, and auth.
- Standard errors: Throw `AppError` in business logic; a middleware maps it to `ORPCError`.

Layout

- contracts/src/orpc/<ns>/<proc>.ts — `oc` builder for a procedure
- contracts/src/orpc/<ns>/index.ts — namespace aggregator (PLOP injects here)
- contracts/src/orpc/contract.ts — root aggregator (PLOP injects here)
- backend/src/rpc/routers/<ns>.ts — handlers per namespace
- backend/src/rpc/routers/index.ts — composes all namespaces
- backend/src/rpc/middleware/** — auth + AppError → ORPCError mapping
- backend/src/rpc/contexts/** — base/session contexts
- backend/src/modules/<feature>/service.ts — feature services (pure functions)
- backend/src/db/** — centralized data layer (entities, repositories, ORM)

Generator

- Add new procedures manually by creating a contract under `contracts/src/orpc/<ns>/<proc>.ts`, wiring it in the `<ns>/index.ts` and `contract.ts`, and implementing a handler under `backend/src/rpc/routers/<ns>.ts`.

Conventions

- Input/output schemas live in contracts. No backend-only schema drift.
- Errors: prefer domain `AppError` (ValidationError, NotFoundError, etc.).
- Logging: use `c.var.logger` via context; avoid console logs in handlers.
- Keep handlers thin: delegate to services; convert `AppError` as needed.

Entities and IDs

- All entities extend a canonical `BaseEntity` (id autoincrement, created_at, updated_at).
- Expose DTO types via `EntityDTO<typeof Entity>` and reference ids as `Entity['id']` to keep a single source of truth.
- Prefer repository signatures that accept `Entity['id']` and cast at the actual DB boundary if needed.

Example: Users

- Contract: `contracts/src/orpc/users/{create,get-by-id}.ts`
- Handler: `backend/src/rpc/routers/users.ts`
- Service: `backend/src/modules/users/service.ts`
