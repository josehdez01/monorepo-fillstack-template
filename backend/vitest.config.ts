import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        include: ['src/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.tsx'],
        exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
        setupFiles: ['src/test/setup-env.ts'],
    },
});
