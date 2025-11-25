import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: [
        'src/**/*.ts',
        'src/**/*.tsx',
        // Exclude tests from build output; still typechecked via `tsc --noEmit`
        '!src/**/*.test.ts',
        '!src/**/*.spec.ts',
        '!src/**/*.test.tsx',
        '!src/**/*.spec.tsx',
    ],
    unbundle: true,
    outDir: 'dist',
    dts: true,
});
