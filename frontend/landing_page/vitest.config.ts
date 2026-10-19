import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        env: {
            VITE_RPC_URL: 'http://localhost:3000',
            VITE_USER_APP_URL: 'http://localhost:5175',
            VITE_ADMIN_APP_URL: 'http://localhost:5174',
        },
        setupFiles: './src/mocks/setup-tests.ts',
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/**/*.test.{ts,tsx}', 'src/mocks/**', 'src/routeTree.gen.ts'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
});
