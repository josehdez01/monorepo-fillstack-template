import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const mode = process.argv[2];
if (!['integration', 'e2e'].includes(mode)) {
    throw new Error('Expected integration or e2e');
}
const cwd = fileURLToPath(new URL('../', import.meta.url));
const project = `template-test-${process.pid}`;
const compose = ['compose', '-p', project, '-f', 'infra/docker-compose.test.yml'];
let child;
let interrupted = false;
function run(command, args, env = process.env) {
    return new Promise((resolve, reject) => {
        if (interrupted) {
            return reject(new Error('Test run interrupted'));
        }
        child = spawn(command, args, { cwd, env, stdio: 'inherit' });
        child.once('error', reject);
        child.once('exit', (code, signal) => {
            child = undefined;
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${command} ${args.join(' ')} failed (${signal ?? code})`));
            }
        });
    });
}
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
        interrupted = true;
        child?.kill(signal);
    });
}
function port(service, internal) {
    const address = execFileSync('docker', [...compose, 'port', service, String(internal)], {
        cwd,
        encoding: 'utf8',
    }).trim();
    const value = Number(address.split(':').at(-1));
    if (!Number.isSafeInteger(value) || value < 1) {
        throw new Error(`Invalid ${service} port`);
    }
    return value;
}
try {
    if (mode === 'e2e') {
        await run('pnpm', ['exec', 'turbo', 'run', 'build', '--filter=./backend']);
    }
    await run('docker', [...compose, 'up', '-d', '--wait', '--wait-timeout', '120']);
    const databaseUrl = `postgres://postgres:postgres@127.0.0.1:${port('postgres', 5432)}/template_test`;
    const redisUrl = `redis://127.0.0.1:${port('redis', 6379)}`;
    const env = {
        ...process.env,
        NODE_ENV: 'test',
        DATABASE_URL: databaseUrl,
        TEST_DATABASE_URL: databaseUrl,
        REDIS_URL: redisUrl,
        TEST_REDIS_URL: redisUrl,
        TEST_INTEGRATION: '1',
        QUEUE_PREFIX: project,
    };
    if (mode === 'integration') {
        await run('pnpm', ['--dir', 'backend', 'test:integration'], env);
    } else {
        await run(process.execPath, ['backend/dist/scripts/migrations-up.js'], env);
        await run('pnpm', ['--dir', 'packages/e2e', 'test'], env);
    }
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
} finally {
    // Only remove this invocation's disposable containers, including after a failed startup.
    try {
        execFileSync('docker', [...compose, 'down', '--volumes', '--remove-orphans'], {
            cwd,
            stdio: 'inherit',
        });
    } catch {
        console.error(
            `Could not clean test services. Run: docker ${compose.join(' ')} down --volumes`,
        );
        process.exitCode = 1;
    }
}
