import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEnv, resetEnvCache } from './env.ts';
afterEach(() => {
    vi.unstubAllEnvs();
    resetEnvCache();
});
describe('production configuration', () => {
    it('never falls back to development service addresses', () => {
        vi.stubEnv('NODE_ENV', 'production');
        vi.stubEnv('DATABASE_URL', undefined);
        vi.stubEnv('REDIS_URL', undefined);
        resetEnvCache();
        expect(() => getEnv()).toThrow();
    });
    it('validates explicit origins and disables proxy trust by default', () => {
        vi.stubEnv('CORS_ORIGINS', 'https://one.example, https://two.example');
        resetEnvCache();
        expect(getEnv().CORS_ORIGINS).toEqual(['https://one.example', 'https://two.example']);
        expect(getEnv().TRUST_PROXY).toBe(false);
    });
});
