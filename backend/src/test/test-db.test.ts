import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestDbManager } from './test-db.ts';
afterEach(() => vi.unstubAllEnvs());
describe('test database safety boundary', () => {
    it('requires an explicit test URL and test mode before making connections', () => {
        vi.stubEnv('TEST_DATABASE_URL', undefined);
        expect(() => new TestDbManager()).toThrow('explicit TEST_DATABASE_URL');
        expect(() => new TestDbManager('postgres://localhost/app')).toThrow('test database');
        vi.stubEnv('NODE_ENV', 'production');
        expect(() => new TestDbManager('postgres://localhost/template_test')).toThrow(
            'NODE_ENV=test',
        );
    });
    it('rejects dropping application or another manager databases before connecting', async () => {
        const manager = new TestDbManager('postgres://localhost/template_test');
        await expect(manager.dropDatabase('app')).rejects.toThrow('not owned');
        await expect(manager.dropDatabase('different_test_test_123')).rejects.toThrow('not owned');
    });
});
