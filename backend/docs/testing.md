Backend Testing and DB Templates

DB Templates (Fast Ephemeral Databases)

- Tests use `TestDbManager` to create ephemeral databases by cloning a template database.
- The template name includes a schema fingerprint (hash of the canonical create-schema SQL). Any schema change yields a new template name, ensuring templates are always up-to-date.
- Env overrides:
    - `TEST_DATABASE_URL` overrides `DATABASE_URL` during tests.
    - `TEST_DB_REBUILD_TEMPLATE=1` forces rebuilding the template.

Usage in Tests

1. Ensure `DATABASE_URL` or `TEST_DATABASE_URL` is defined (pointing at a Postgres cluster).
2. In your test `beforeAll`, call `new TestDbManager().createEphemeral()` to get a unique DB URL, set `process.env.DATABASE_URL` to it, then initialize MikroORM.
3. After tests, close ORM and `dropDatabase(name)` to clean up.

Schema Validation

- Tests call `getEnv()` to validate environment variables using Zod.
- Required non-secret variables get default placeholders in tests (e.g., `GITHUB_WEBHOOK_SECRET`, `SLACK_SIGNING_SECRET`).

Example: see `backend/src/rpc/users.test.ts` for an end-to-end test using `RPCHandler` and the DB template manager.
