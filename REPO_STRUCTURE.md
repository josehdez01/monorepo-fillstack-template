# Architecture decisions

## Contracts are the boundary

RPC input, output, and declared error schemas live in `contracts`. Both server implementations and clients infer their types from these schemas. Frontends never import backend modules, database entities, or private configuration. Queue contracts use `torero-mq/contract` so consumers do not need Redis or worker code.

An RPC handler adapts transport context to a service. A service owns domain rules and returns an explicit DTO; a repository handles persistence. Database uniqueness constraints remain the final authority under concurrency. Avoid additional interfaces around every function: introduce an abstraction when it protects a real boundary or supports a concrete alternative.

## Scoped state, explicit lifetime

`createBackendRuntime` owns the ORM, queue runtime, and optional HTTP server. Startup is explicit, concurrent starts share one promise, and close is idempotent. HTTP requests and queue jobs each have their own EntityManager context. Never retain a request EntityManager in a singleton or reuse it across background jobs.

Close stops new work, drains HTTP and queue activity, then closes database connections. Worker-only processes use the same shutdown path. `/health` is a liveness endpoint; `/ready` reports startup/shutdown readiness, not a continuous infrastructure probe.

## Demo sessions are intentionally limited

The sample session is an anonymous bearer capability for demonstrating typed flows. It has an expiry and can be revoked. It does not prove identity, provide tenant isolation, or authorize access to a particular user's data. Production disables both issuance and protected demo procedures. Replace this boundary with your authentication provider and enforce ownership in services before shipping real user data. The admin app is a service-status example, not a privileged management console.

## Source during development, JavaScript in production

Workspace packages expose a `development` condition targeting source and a default export targeting built JavaScript. TypeScript uses the same condition. Vite picks source during development; production builds use artifacts built by the task graph. This avoids duplicated TypeScript aliases and enables edits to shared code to propagate during development.

Dependency versions are exact and centralized in `pnpm-workspace.yaml`. Build script permissions are explicit. Unit tests are separate from integration/browser tests, and service-backed results are never cached by Turbo.

## Small deployable units

Each frontend owns its router, API client, environment and deployment output. Shared packages hold reusable behavior and components. The backend can run API and workers together or separately without changing job contracts. Queue prefixes distinguish applications/environments; Redis must use `noeviction` for durable queue metadata.

Keep browser environment variables public by design. Validate server configuration on startup and use explicit CORS origins. Trust forwarded headers only behind a proxy you control. Logging includes generated request IDs and excludes known credential fields; application code should still avoid logging full inputs, headers, URLs with credentials, or tokens.
