import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generateMigrationRegistry } from './migrations-registry.ts';

describe('bundled migration registry', () => {
    it('generates deterministic migration imports and excludes snapshots/generated files', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'template-migrations-'));
        try {
            for (const file of [
                'Migration20300101000000.ts',
                'Migration20290101000000.ts',
                'registry.gen.ts',
                '.snapshot-test.json',
                'Migration20300101000000.d.ts',
            ]) {
                await writeFile(join(directory, file), '');
            }
            const target = await generateMigrationRegistry(pathToFileURL(`${directory}/`));
            const output = await readFile(target, 'utf8');
            expect(output.indexOf('Migration20290101000000')).toBeLessThan(
                output.indexOf('Migration20300101000000'),
            );
            expect(output).not.toContain('.snapshot');
            expect(output).not.toContain('.d.ts');
            await generateMigrationRegistry(pathToFileURL(`${directory}/`));
            expect(await readFile(target, 'utf8')).toBe(output);
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
});
