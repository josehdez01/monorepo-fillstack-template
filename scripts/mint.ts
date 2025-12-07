#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

interface Options {
    scope: string;
    dry: boolean;
}

function parseArgs(argv: string[]): Options {
    let scope = '@acme';
    let dry = false;
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if ((a === '--scope' || a === '-s') && argv[i + 1]) {
            scope = argv[++i]!;
            continue;
        }
        if (a === '--dry') {
            dry = true;
        }
    }
    if (!scope.startsWith('@')) {
        scope = `@${scope}`;
    }
    if (!/^@[a-z0-9][a-z0-9-_]*$/i.test(scope)) {
        throw new Error(`Invalid scope '${scope}'. Use e.g. @acme or @my-org`);
    }
    return { scope, dry };
}

const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', '.turbo', '.git']);

async function walk(dir: string, out: string[] = []): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
        if (IGNORE_DIRS.has(e.name)) {
            continue;
        }
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            await walk(p, out);
        } else {
            out.push(p);
        }
    }
    return out;
}

async function updateFile(file: string, from: string, to: string, dry: boolean) {
    const buf = await fs.readFile(file, 'utf8');
    if (!buf.includes(from)) {
        return;
    }
    const next = buf.split(from).join(to);
    if (!dry) {
        await fs.writeFile(file, next);
    }
}

async function rewritePackageJson(file: string, scope: string, dry: boolean) {
    const buf = await fs.readFile(file, 'utf8');
    const pkg = JSON.parse(buf) as { name?: string } & Record<string, unknown>;
    const name = pkg.name ?? '';
    if (name.startsWith('@template/')) {
        const renamed = name.replace(/^@template\//, `${scope}/`);
        pkg.name = renamed;
        if (!dry) {
            await fs.writeFile(file, `${JSON.stringify(pkg, null, 4)}\n`);
        }
        return true;
    }
    // Root package.json named @template/monorepo — re-scope
    if (name === '@template/monorepo') {
        pkg.name = `${scope}/monorepo`;
        if (!dry) {
            await fs.writeFile(file, `${JSON.stringify(pkg, null, 4)}\n`);
        }
        return true;
    }
    return false;
}

const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.json', '.md', '.hbs', '.yaml', '.yml']);

async function main() {
    const cwd = process.cwd();
    const { scope, dry } = parseArgs(process.argv);

    const files = await walk(cwd);
    const pkgFiles = files.filter((f) => path.basename(f) === 'package.json');

    // 1) Re-scope package.json names
    for (const f of pkgFiles) {
        await rewritePackageJson(f, scope, dry);
    }

    // 2) Replace import specifiers @template/* -> new scope
    const from = '@template/';
    const to = `${scope.replace(/\/$/, '')}/`;
    for (const f of files) {
        const ext = path.extname(f);
        if (TEXT_EXTENSIONS.has(ext)) {
            await updateFile(f, from, to, dry);
        }
    }

    const msg = dry ? '[DRY RUN] Mint finished without writing changes.' : 'Mint complete.';
    console.log(`${msg} New scope: ${to}`);
    console.log('Next steps:');
    console.log('- Review package names and imports');
    console.log('- Run: pnpm install');
}

try {
    await main();
} catch (err) {
    console.error(err);
    process.exit(1);
}
