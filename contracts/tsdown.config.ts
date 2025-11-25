import { defineConfig } from 'tsdown';

export default defineConfig({
    dts: true,
    entry: ['src/**/*.ts', 'src/**/*.tsx'],
    outDir: 'dist',
    unbundle: true,
});
