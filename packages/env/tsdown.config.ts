import { defineConfig } from 'tsdown';

export default defineConfig({
    dts: true,
    entry: ['src/**/*.ts', '!src/**/*.test.ts'],
    outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
    outDir: 'dist',
    unbundle: true,
});
