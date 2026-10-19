import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createNodeEnv, loadEnvFiles } from './node.ts';
import { parseViteEnv } from './browser.ts';

const dirs: string[] = [];
afterEach(() => {
    vi.unstubAllEnvs();
    for (const dir of dirs.splice(0)) {
        rmSync(dir, { recursive: true });
    }
});

describe('environment boundaries', () => {
    it('uses Node dotenv syntax and preserves the process > local > example precedence', () => {
        const cwd = mkdtempSync(join(tmpdir(), 'template-env-'));
        dirs.push(cwd);
        for (const key of ['TEMPLATE_ENV_A', 'TEMPLATE_ENV_B', 'TEMPLATE_ENV_C']) {
            vi.stubEnv(key, undefined);
        }
        vi.stubEnv('TEMPLATE_ENV_A', 'shell');
        writeFileSync(
            join(cwd, '.env.local'),
            'export TEMPLATE_ENV_A=local\nTEMPLATE_ENV_B="value # quoted"\nTEMPLATE_ENV_C="first\nsecond"\n',
        );
        writeFileSync(
            join(cwd, '.env'),
            'TEMPLATE_ENV_A=default\nTEMPLATE_ENV_B=default # comment\n',
        );
        loadEnvFiles(['.missing', '.env.local', '.env'], { cwd });
        expect(process.env.TEMPLATE_ENV_A).toBe('shell');
        expect(process.env.TEMPLATE_ENV_B).toBe('value # quoted');
        expect(process.env.TEMPLATE_ENV_C).toBe('first\nsecond');
        loadEnvFiles(['.env'], { cwd, override: true });
        expect(process.env.TEMPLATE_ENV_B).toBe('default');
    });

    it('validates and transforms without leaking unrelated variables', () => {
        expect(
            createNodeEnv(
                { PORT: z.coerce.number().int() },
                { defaults: { PORT: 3000 }, env: { PORT: '4000', SECRET: 'private' } },
            ),
        ).toEqual({ PORT: 4000 });
        expect(() =>
            createNodeEnv({ PORT: z.coerce.number() }, { env: { PORT: 'wrong' } }),
        ).toThrow('PORT');
    });

    it('reads explicit Vite input and handles false correctly', () => {
        expect(
            parseViteEnv(
                { VITE_FEATURE: z.stringbool() },
                { VITE_FEATURE: 'false', SECRET: 'hidden' },
            ),
        ).toEqual({ VITE_FEATURE: false });
        expect(() =>
            parseViteEnv({ VITE_FEATURE: z.stringbool() }, { VITE_FEATURE: 'maybe' }),
        ).toThrow('VITE_FEATURE');
        expect(() =>
            parseViteEnv({ DATABASE_URL: z.string() }, { DATABASE_URL: 'secret' }),
        ).toThrow('Public environment keys');
    });
});
