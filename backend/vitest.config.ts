import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.tsx'],
        exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
        setupFiles: ['src/test/setup-env.ts'],
    },
});
