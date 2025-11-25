#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function ensureFile(from: string, to: string, { force = false } = {}) {
    try {
        if (!force) {
            await fs.access(to);
            console.log(`[env] Skipped: ${path.basename(to)} already exists`);
            return;
        }
    } catch {
        // destination does not exist -> continue
    }
    const src = await fs.readFile(from);
    await fs.writeFile(to, src);
    console.log(`[env] Wrote ${path.basename(to)} from ${path.basename(from)}`);
}

async function main() {
    const force = process.argv.includes('--force');
    const cwd = process.cwd();
    const backendDir = cwd;
    const envExample = path.join(backendDir, '.env.example');
    const envLocal = path.join(backendDir, '.env.local');
    const envTestExample = path.join(backendDir, '.env.test.example');
    const envTestLocal = path.join(backendDir, '.env.test.local');

    // Materialize backend envs
    await ensureFile(envExample, envLocal, { force });
    await ensureFile(envTestExample, envTestLocal, { force });
}

try {
    await main();
} catch (err) {
    console.error('[env] setup error', err);
    process.exit(1);
}
