import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: { conditions: ['development'] },
    test: {
        include: ['src/**/*.test.ts'],
        exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
        setupFiles: ['src/test/setup-env.ts'],
        testTimeout: 15_000,
        hookTimeout: 30_000,
    },
});
