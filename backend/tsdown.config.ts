import { defineConfig } from 'tsdown';

// This is an application, not a package: bundle first-party code, keep dependencies external.
// Migration classes are explicitly registered so the production bundle never scans TS files.
export default defineConfig({
    entry: {
        index: 'src/index.ts',
        'scripts/queue-demo': 'src/scripts/queue-demo.ts',
        'scripts/migrations-up': 'src/scripts/migrations-up.ts',
        'scripts/migrations-down': 'src/scripts/migrations-down.ts',
    },
    outDir: 'dist',
    fixedExtension: false,
    platform: 'node',
    target: 'node26',
    dts: false,
    sourcemap: true,
});
