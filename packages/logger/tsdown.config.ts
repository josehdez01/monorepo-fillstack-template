import { defineConfig } from 'tsdown';

export default defineConfig({
    dts: true,
    entry: ['src/**/*.ts'],
    outDir: 'dist',
    unbundle: true,
});
