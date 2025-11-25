/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig({
    plugins: [react(), TanStackRouterVite()],
    test: {
        environment: 'jsdom',
        setupFiles: './src/mocks/setup-tests.ts',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
