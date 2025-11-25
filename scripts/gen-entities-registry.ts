#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

function toPascalCase(base: string): string {
    const stem = base.replace(/\.[^/.]+$/, '');
    return stem
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
}

async function main() {
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    const repoRoot = path.resolve(scriptDir, '..');
    const entitiesDir = path.join(repoRoot, 'backend', 'src', 'db', 'entities');
    const outFile = path.join(entitiesDir, 'registry.gen.ts');

    let files = await fs.readdir(entitiesDir);
    files = files.filter((f) => f.endsWith('.ts'));
    files = files.filter(
        (f) =>
            !f.endsWith('.test.ts') &&
            f !== 'registry.gen.ts' &&
            f !== 'index.ts' &&
            f !== 'base.ts',
    );

    const entries = files
        .map((f) => ({ file: f, name: toPascalCase(f) }))
        .toSorted((a, b) => a.name.localeCompare(b.name));

    const lines: string[] = [];
    lines.push('// This file is generated. Do not edit manually.');
    lines.push('// Run: pnpm --filter @template/backend db:entities:gen');
    lines.push('');
    for (const e of entries) {
        lines.push(`import { ${e.name} } from './${e.file}';`);
    }
    lines.push('');
    lines.push(`export const entities = [${entries.map((e) => e.name).join(', ')}] as const;`);
    lines.push('');

    await fs.writeFile(outFile, lines.join('\n'));
    // eslint-disable-next-line no-console
    console.log(`Updated ${path.relative(repoRoot, outFile)} with ${entries.length} entities.`);
}

try {
    await main();
} catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
}
