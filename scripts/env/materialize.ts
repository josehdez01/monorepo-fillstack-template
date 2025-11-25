#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

interface Target {
    from: string;
    to: string;
}
interface Project {
    name: string;
    dir: string;
    targets: Target[];
}

const projects: Project[] = [
    {
        name: 'backend',
        dir: 'backend',
        targets: [
            { from: '.env.example', to: '.env.local' },
            { from: '.env.test.example', to: '.env.test.local' },
        ],
    },
    {
        name: 'frontend:landing_page',
        dir: 'frontend/landing_page',
        targets: [{ from: '.env.example', to: '.env.local' }],
    },
    {
        name: 'frontend:user_app',
        dir: 'frontend/user_app',
        targets: [{ from: '.env.example', to: '.env.local' }],
    },
    {
        name: 'frontend:admin_app',
        dir: 'frontend/admin_app',
        targets: [{ from: '.env.example', to: '.env.local' }],
    },
];

async function ensureFile(from: string, to: string, { force = false } = {}) {
    try {
        if (!force) {
            await fs.access(to);
            console.log(`[env] Skipped: ${path.relative(process.cwd(), to)} already exists`);
            return;
        }
    } catch {
        // destination does not exist
    }
    try {
        const src = await fs.readFile(from);
        await fs.writeFile(to, src);
        console.log(`[env] Wrote ${path.relative(process.cwd(), to)} from ${path.basename(from)}`);
    } catch (err) {
        console.warn(`[env] Skipped ${path.relative(process.cwd(), to)}: ${String(err)}`);
    }
}

async function main() {
    const force = process.argv.includes('--force');
    const cwd = process.cwd();

    for (const project of projects) {
        const root = path.join(cwd, project.dir);
        for (const target of project.targets) {
            const from = path.join(root, target.from);
            const to = path.join(root, target.to);
            await ensureFile(from, to, { force });
        }
    }
}

try {
    await main();
} catch (err) {
    console.error('[env] setup error', err);
    process.exit(1);
}
