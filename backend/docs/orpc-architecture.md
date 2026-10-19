# RPC architecture

`contracts/src/orpc` is the public schema and declared-error boundary. `backend/src/rpc/routers` implements it with oRPC's contract-first API. Routers call domain services; services operate on the request-scoped MikroORM entity manager; database constraints enforce concurrent invariants. Changes propagate to typed clients through workspace conditional exports during development and built package exports in production.

`createApp` returns a fresh Hono application. It installs request metadata/logging, an explicit browser-origin allowlist, health/readiness probes, request-scoped ORM middleware and the oRPC fetch adapter. The native Request goes directly to the adapter; body parser proxies and shared mutable route registration are unnecessary.

`BaseContext` supplies request ID, logger, headers, peer address, scoped entity manager and the server-owned `demoSessionsEnabled` flag. Forwarded IP addresses are ignored unless `TRUST_PROXY=true` is configured for a trusted reverse proxy. Domain errors become declared oRPC errors through the application error middleware; unexpected infrastructure errors remain server errors.

## Demo sessions are not authentication

Anonymous sessions only demonstrate a bearer-session boundary. They have a 24-hour lifetime, persist expiry/revocation, use UUID token validation, and are checked in the database on every request. The public revoke operation invalidates the current session. Tokens are never embedded in greetings or logger bindings.

The production runtime disables both demo issuance and demo-protected endpoints, with no enabling flag. Before building a real product, replace the demo-session middleware with a real identity provider and authorization policy tied to users/tenants. The sample user directory does not establish user ownership and must not be exposed as a production account API.

The runtime owns HTTP, workers and ORM resources explicitly. Shutdown stops accepting requests, drains jobs/requests, and then closes the database. Application imports do not connect to services.
