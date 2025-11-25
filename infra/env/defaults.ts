export const backendEnvDefaults = {
    NODE_ENV: 'development',
    PORT: 3000,
    DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/app',
    REDIS_URL: 'redis://localhost:6379',
    ROLE: 'all',
} as const;

export const backendTestEnvDefaults = {
    NODE_ENV: 'test',
    PORT: 3001,
    DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/app',
    REDIS_URL: 'redis://localhost:6379',
    ROLE: 'api',
} as const;

export const frontendEnvDefaults = {
    VITE_RPC_URL: 'http://localhost:3000',
    VITE_ORPC_VALIDATE_REQUESTS: 'true',
} as const;
