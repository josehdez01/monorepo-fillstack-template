# Backend tests

`pnpm --filter @template/backend test` runs deterministic unit tests with no services. `pnpm test:integration` at the repository root starts a disposable PostgreSQL/Redis Compose project on random loopback ports, runs the backend integration suite, and removes its containers/volumes even after failure. It never uses development service volumes.

Integration requires `TEST_INTEGRATION=1`, `NODE_ENV=test`, an explicit `TEST_DATABASE_URL` whose database name includes `test`, and `TEST_REDIS_URL`. The root runner supplies all of these. Avoid invoking integration tests against application databases.

`TestDbManager` fingerprints migration files and initializes a migration-backed template under a PostgreSQL advisory lock. Each suite receives an independently named cloned database. ORM configuration receives that database URL directly; tests never mutate `process.env.DATABASE_URL` to redirect a cached configuration import. Only databases owned by this manager may be dropped. There is no refresh-application-database helper.

Coverage includes the actual Hono/oRPC request boundary, session expiry/revocation, production demo denial, concurrent duplicate email conflicts, persisted readback, Torero worker startup and shutdown, startup rollback, and close during initialization. Add feature tests at both domain and transport boundaries when they verify different behavior. Use `expectTypeOf` for inference rather than runtime assertions on fabricated entities.
