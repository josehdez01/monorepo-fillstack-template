ORPC Architecture

Overview

- Hono acts as the HTTP transport: `/health`, middleware, and future webhooks.
- ORPC provides the application API under `/rpc` with contract-first design (Zod schemas).
- Business logic is organized into feature services (modules) that orchestrate repositories and queues.
- All data-related code (entities, repositories, ORM setup) lives under `backend/src/db/`.

Motivation

- Contract-first avoids schema drift and tightens type guarantees across frontend and backend.
- Clear separation: handlers (IO), services (business logic), repositories (persistence) enables scaling and testing.
- Centralized data layer under `db/` provides a single place to reason about persistence and migrations.

Code Organization

- contracts/src/orpc/\*\* — namespaced contracts and root contract aggregator
- backend/src/rpc/\*\* — handlers grouped per namespace (compose the contract)
- backend/src/modules/<feature>/service.ts — feature services (pure functions)
- backend/src/db/\*\* — MikroORM entities, repositories, and ORM bootstrap
- backend/src/queues/\*\* — typed queues via `torero-mq`

Request Context

- `RpcContext` provides `requestId`, `logger`, a per-request `EntityManager`, and `headers`.
- Middleware attaches the context in `backend/src/index.ts` when mounting the RPC handler.

Error Policy

- Services throw `AppError` (`ValidationError`, `NotFoundError`, etc.).
- The preconfigured implementer maps `AppError` → `ORPCError` at the router level with built‑in middleware dedupe.

Development Flow

1. Define or update a contract in `contracts/src/orpc/<ns>/<proc>.ts` (inputs/outputs/errors).
2. Implement the handler in `backend/src/rpc/<ns>.ts` using the contract.
3. Delegate to a service in `backend/src/modules/<feature>/service.ts` and reuse repositories under `backend/src/db/`.

Notes

- Keep handlers thin; prefer pushing logic into services for reuse and testing.
- Prefer repository signatures that accept `Entity['id']` branded types; cast at the API edges as needed.
- Avoid global singletons for data or auth; rely on the request-scoped context.
