import { promises as fs } from 'node:fs';
import path from 'node:path';

async function regenerateEntitiesRegistry(startDir) {
    // Resolve repo root by walking up until backend/src/db/entities exists
    let dir = startDir;
    try {
        const stat = await fs.stat(dir);
        if (!stat.isDirectory()) dir = path.dirname(dir);
    } catch {}
    while (true) {
        const probe = path.join(dir, 'backend', 'src', 'db', 'entities');
        try {
            const s = await fs.stat(probe);
            if (s.isDirectory()) break;
        } catch {}
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }

    const entitiesDir = path.join(dir, 'backend', 'src', 'db', 'entities');
    const outFile = path.join(entitiesDir, 'registry.gen.ts');
    let files = await fs.readdir(entitiesDir);
    files = files.filter((f) => f.endsWith('.ts'));
    // Exclude non-entity and generated files
    files = files.filter(
        (f) =>
            !f.endsWith('.test.ts') &&
            f !== 'registry.gen.ts' &&
            f !== 'index.ts' &&
            f !== 'base.ts',
    );
    function toPascalCase(base) {
        return base
            .replace(/\.[^/.]+$/, '')
            .split(/[^a-zA-Z0-9]+/)
            .filter(Boolean)
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join('');
    }
    const entries = files
        .map((f) => ({ file: f, name: toPascalCase(f) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    const lines = [];
    lines.push('// This file is generated. Do not edit manually.');
    lines.push('// Regenerate via turbo generator or pnpm db:entities:gen');
    lines.push('');
    for (const e of entries) {
        lines.push(`import { ${e.name} } from './${e.file}';`);
    }
    lines.push('');
    lines.push(`export const entities = [${entries.map((e) => e.name).join(', ')}] as const;`);
    lines.push('');
    await fs.writeFile(outFile, lines.join('\n'));
    return `Updated ${path.relative(dir, outFile)} with ${entries.length} entities.`;
}

export default function generator(plop) {
    plop.setGenerator('package', {
        description: 'Generate a new package',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'What is the name of the package? (e.g. ui, logger)',
            },
            {
                type: 'input',
                name: 'type',
                message: 'What type of package is this? (e.g. ui, config, utility)',
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'packages/{{name}}/package.json',
                templateFile: 'templates/package/package.json.hbs',
            },
            {
                type: 'add',
                path: 'packages/{{name}}/tsconfig.json',
                templateFile: 'templates/package/tsconfig.json.hbs',
            },
            {
                type: 'add',
                path: 'packages/{{name}}/src/index.ts',
                template: "export const name = '{{name}}';",
            },
        ],
    });

    plop.setGenerator('app', {
        description: 'Generate a new frontend application',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'What is the name of the app? (e.g. dashboard)',
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'frontend/{{name}}/package.json',
                templateFile: 'templates/app/package.json.hbs',
            },
            {
                type: 'add',
                path: 'frontend/{{name}}/tsconfig.json',
                templateFile: 'templates/app/tsconfig.json.hbs',
            },
            {
                type: 'add',
                path: 'frontend/{{name}}/tsconfig.node.json',
                templateFile: 'templates/app/tsconfig.node.json.hbs',
            },
            {
                type: 'add',
                path: 'frontend/{{name}}/vite.config.ts',
                templateFile: 'templates/app/vite.config.ts.hbs',
            },
            {
                type: 'add',
                path: 'frontend/{{name}}/index.html',
                templateFile: 'templates/app/index.html.hbs',
            },
            {
                type: 'add',
                path: 'frontend/{{name}}/env.d.ts',
                templateFile: 'templates/app/env.d.ts.hbs',
            },
            {
                type: 'add',
                path: 'frontend/{{name}}/src/main.tsx',
                templateFile: 'templates/app/src/main.tsx.hbs',
            },
            {
                type: 'add',
                path: 'frontend/{{name}}/src/App.tsx',
                templateFile: 'templates/app/src/App.tsx.hbs',
            },
            {
                type: 'add',
                path: 'frontend/{{name}}/src/routes/__root.tsx',
                templateFile: 'templates/app/src/routes/__root.tsx.hbs',
            },
            {
                type: 'add',
                path: 'frontend/{{name}}/src/routes/index.tsx',
                templateFile: 'templates/app/src/routes/index.tsx.hbs',
            },
            {
                type: 'add',
                path: 'frontend/{{name}}/src/app/router-context.ts',
                templateFile: 'templates/app/src/app/router-context.ts.hbs',
            },
            {
                type: 'add',
                path: 'frontend/{{name}}/src/api/orpc-client.ts',
                templateFile: 'templates/app/src/api/orpc-client.ts.hbs',
            },
        ],
    });

    // Queue generator — scaffolds a typed BullMQ queue using torero-mq
    plop.setGenerator('queue', {
        description: 'Generate a new backend queue (BullMQ via torero-mq)',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'Queue name (e.g. email-send, report-build)',
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'backend/src/queues/{{kebabCase name}}-queue.ts',
                templateFile: 'templates/queue/queue.ts.hbs',
            },
        ],
    });

    // DB entity generator — entity + repository
    plop.setGenerator('db-entity', {
        description: 'Generate a MikroORM entity with repository',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'Entity name (PascalCase, e.g. Invoice)',
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'backend/src/db/entities/{{kebabCase name}}.ts',
                templateFile: 'templates/db/entity.ts.hbs',
            },
            {
                type: 'add',
                path: 'backend/src/db/repositories/{{kebabCase name}}-repo.ts',
                templateFile: 'templates/db/repository.ts.hbs',
            },
            // Keep registry in sync after generation
            async () => {
                const msg = await regenerateEntitiesRegistry(process.cwd());
                return msg;
            },
            // Intentionally no service/use-case generation; keep services hand-written
        ],
    });
}
