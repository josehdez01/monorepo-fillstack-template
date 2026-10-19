import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cwd = mkdtempSync(path.join(tmpdir(), 'fullstack-generators-'));
const run = (args) =>
    execFileSync('pnpm', args, {
        cwd,
        stdio: 'inherit',
        env: { ...process.env, SKIP_INSTALL_SIMPLE_GIT_HOOKS: '1' },
    });
try {
    const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
        cwd: root,
        encoding: 'utf8',
    }).split('\0');
    for (const name of new Set(files)) {
        if (!name || !existsSync(path.join(root, name))) {
            continue;
        }
        const target = path.join(cwd, name);
        mkdirSync(path.dirname(target), { recursive: true });
        cpSync(path.join(root, name), target);
    }
    run(['install', '--frozen-lockfile']);
    const cases = [
        ['package', 'smoke-utils', 'packages/smoke-utils/tsdown.config.ts'],
        ['app', 'smoke-app', 'frontend/smoke-app/src/env.ts'],
        ['db-entity', 'smoke-record', 'backend/src/db/entities/smoke-record.ts'],
        ['feature', 'smoke-feature', 'backend/src/rpc/routers/smoke-feature.ts'],
        ['queue', 'smoke-job', 'backend/src/queues/smoke-job-queue.ts'],
    ];
    for (const [generator, name, expected] of cases) {
        run(['gen', generator, '--args', name]);
        if (!existsSync(path.join(cwd, expected))) {
            throw new Error(`${generator} did not produce ${expected}`);
        }
    }
    const registry = readFileSync(
        path.join(cwd, 'backend/src/db/entities/registry.gen.ts'),
        'utf8',
    );
    if (!registry.includes('SmokeRecord')) {
        throw new Error('Entity generator did not update registry');
    }
    run(['install']);
    run(['build']);
    run(['typecheck']);
    console.log('All five generated slices build and typecheck in a separate workspace.');
} finally {
    rmSync(cwd, { recursive: true, force: true });
}
