import { defineConfig } from 'tsdown';

export default defineConfig({
    // Compile all component files individually to preserve structure (bundleless)
    entry: [
        'src/shadcn/ui/**/*.ts',
        'src/shadcn/ui/**/*.tsx',
        'src/components/retroui/**/*.ts',
        'src/components/retroui/**/*.tsx',
        // Exclude preview example files from build/typings
        '!src/components/retroui/preview/**',
        'src/lib/**/*.ts',
    ],
    unbundle: true,
    dts: true,
    outDir: 'dist',
});
