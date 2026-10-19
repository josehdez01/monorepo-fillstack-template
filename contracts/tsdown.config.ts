import { defineConfig } from 'tsdown';

export default defineConfig({
    dts: true,
    entry: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/*.test-d.ts', '!src/**/*.d.ts'],
    outDir: 'dist',
    fixedExtension: false,
    unbundle: true,
});
