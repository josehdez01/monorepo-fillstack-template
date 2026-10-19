// Unit tests do not read local environment files or infer database integration availability.
process.env.NODE_ENV = 'test';
process.env.PORT ??= '3001';
process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:55432/template_test';
process.env.REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:56379';
process.env.ROLE ??= 'all';
