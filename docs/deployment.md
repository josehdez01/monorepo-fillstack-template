# Deploying an application

The backend runs on Node 26.12 or later in the Node 26 line, with PostgreSQL 18 and Redis 8.10. Frontends produce static assets. Keep each environment's database, Redis prefix, CORS origins, and public API URL separate.

## Backend

From a clean checkout:

```sh
pnpm install --frozen-lockfile
pnpm exec turbo run build --filter=@template/backend
```

Ship the workspace's production dependencies and build artifacts together. `backend/dist` alone is not a standalone application: its external dependencies include the built `contracts`, `env`, and `logger` packages. Deploying the workspace preserves pnpm's links; do not copy a symlinked `node_modules` directory independently of its targets.

Set `NODE_ENV=production`, `DATABASE_URL`, and `REDIS_URL` in the process environment. Production never loads local `.env` files and requires explicit connection URLs. Set `CORS_ORIGINS` to the comma-separated frontend origins, `QUEUE_PREFIX` to a stable application/environment identifier, and `PORT` / `HOST` as required by your host. Only enable `TRUST_PROXY=true` behind a trusted proxy that overwrites incoming forwarding headers.

Run the **built** migration entrypoint once in a release job before starting replicas:

```sh
node backend/dist/scripts/migrations-up.js
node backend/dist/index.js
```

Migration classes are bundled through an explicit generated registry; production does not scan TypeScript source files. Review migrations before applying them. Keep backups and use forward-compatible schema changes for rolling deployments.

Use `ROLE=all` for one process, or separate `ROLE=api` and `ROLE=worker` processes with the same `QUEUE_PREFIX` and Redis. Workers do not expose HTTP. Send SIGTERM and allow enough time to finish in-flight requests and jobs; queue handlers must honor cooperative cancellation and external request deadlines. Configure HTTP probes against `/health` (liveness) and `/ready` (startup/shutdown readiness).

Redis must use `maxmemory-policy noeviction`. Configure persistence, backups, and appropriate resource limits for your workload. BullMQ retries can repeat side effects, so use idempotency keys at the external service and an outbox when a database change must reliably enqueue work.

The bundled examples use anonymous demo sessions and are disabled in production. Integrate authentication, service-level authorization, and request limits appropriate to your application before exposing its data. The status app does not implement admin authorization.

## Frontends

Set the public API URL at **build time** for each deployment:

```sh
VITE_RPC_URL=https://api.example.com pnpm exec turbo run build --filter=frontend/user_app
```

Serve `frontend/user_app/dist` with HTTPS and an SPA fallback to `index.html`. The other apps follow the same pattern. `VITE_*` values are public and must never contain credentials. Turbo includes frontend environment values in its build cache key.

Keep devtools out of production bundles. Serve hashed assets with long immutable cache lifetimes and `index.html` with a short lifetime so new deployments can be discovered. Validate a production build against the deployed API origin, including CORS and the application's actual identity/session flow.
