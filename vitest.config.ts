import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: [
            'scripts/**/*.test.ts',
            'packages/env/src/**/*.test.ts',
            'packages/logger/src/**/*.test.ts',
        ],
        coverage: {
            provider: 'v8',
            include: ['packages/env/src/*.ts', 'packages/logger/src/*.ts', 'scripts/lib/*.ts'],
            reporter: ['text', 'lcov'],
        },
    },
});
