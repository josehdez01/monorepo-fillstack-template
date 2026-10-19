import { execFileSync } from 'node:child_process';
import path from 'node:path';

function validName(value) {
    return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value) &&
        !['constructor', 'prototype', '__proto__'].includes(value)
        ? true
        : 'Use a lowercase kebab-case name (e.g. billing-report).';
}

export default function generator(plop) {
    const register = plop.setGenerator.bind(plop);
    plop.setGenerator = (name, config) =>
        register(name, {
            ...config,
            actions: [
                (answers) => {
                    const result = validName(answers.name);
                    if (result !== true) {
                        throw new Error(result);
                    }
                    return 'Validated name';
                },
                ...config.actions,
                (answers) => {
                    const files = {
                        package: [`packages/${answers.name}`],
                        app: [`frontend/${answers.name}`],
                        'db-entity': [
                            `backend/src/db/entities/${answers.name}.ts`,
                            `backend/src/db/repositories/${answers.name}-repo.ts`,
                            'backend/src/db/entities/registry.gen.ts',
                        ],
                        feature: [
                            `contracts/src/orpc/${answers.name}`,
                            'contracts/src/orpc/contract.ts',
                            `backend/src/modules/${answers.name}`,
                            `backend/src/rpc/routers/${answers.name}.ts`,
                            'backend/src/rpc/routers/index.ts',
                        ],
                        queue: [`backend/src/queues/${answers.name}-queue.ts`],
                    }[name];
                    execFileSync('pnpm', ['exec', 'prettier', '--write', ...files], {
                        cwd: plop.getDestBasePath(),
                        stdio: 'inherit',
                    });
                    return 'Formatted generated files';
                },
            ],
        });
    plop.setGenerator('package', {
        description: 'Generate a new package',
        prompts: [
            {
                type: 'input',
                name: 'name',
                validate: validName,
                message: 'What is the name of the package? (e.g. ui, logger)',
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'packages/{{name}}/tsdown.config.ts',
                template:
                    "import { defineConfig } from 'tsdown';\nexport default defineConfig({ entry: ['src/index.ts'], dts: true, outExtensions: () => ({ js: '.js', dts: '.d.ts' }) });\n",
            },
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
                validate: validName,
                message: 'What is the name of the app? (e.g. dashboard)',
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'frontend/{{name}}/.env.example',
                template: 'VITE_RPC_URL=http://localhost:3000\n',
            },
            {
                type: 'add',
                path: 'frontend/{{name}}/src/env.ts',
                templateFile: 'templates/app/src/env.ts.hbs',
            },
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
            {
                type: 'add',
                path: 'frontend/{{name}}/src/styles.css',
                templateFile: 'templates/app/src/styles.css.hbs',
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
                validate: validName,
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
                validate: validName,
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
                execFileSync(
                    process.execPath,
                    [
                        '--import',
                        'tsx',
                        path.join(plop.getDestBasePath(), 'scripts/gen-entities-registry.ts'),
                    ],
                    { stdio: 'inherit' },
                );
                return 'Updated entity registry';
            },
            // Intentionally no service/use-case generation; keep services hand-written
        ],
    });

    // Feature generator — Full stack vertical slice (Contract + Backend + RPC)
    plop.setGenerator('feature', {
        description: 'Generate a new feature (Contract + Backend Module + RPC Router)',
        prompts: [
            {
                type: 'input',
                name: 'name',
                validate: validName,
                message: 'Feature name (e.g. posts, comments)',
            },
        ],
        actions: [
            // 1. Contract
            {
                type: 'add',
                path: 'contracts/src/orpc/{{kebabCase name}}/index.ts',
                templateFile: 'templates/feature/contract/index.ts.hbs',
            },
            {
                type: 'add',
                path: 'contracts/src/orpc/{{kebabCase name}}/list.ts',
                templateFile: 'templates/feature/contract/list.ts.hbs',
            },
            {
                type: 'modify',
                path: 'contracts/src/orpc/contract.ts',
                pattern: /(import.*from.*;\n)(?!import)/,
                template: "$1import { {{camelCase name}} } from './{{kebabCase name}}/index.ts';\n",
            },
            {
                type: 'modify',
                path: 'contracts/src/orpc/contract.ts',
                pattern: /(export const appContract = oc\.router\({)/,
                template: '$1\n    {{camelCase name}},',
            },
            // 2. Backend Module
            {
                type: 'add',
                path: 'backend/src/modules/{{kebabCase name}}/service.ts',
                templateFile: 'templates/feature/service.ts.hbs',
            },
            // 3. RPC Router
            {
                type: 'add',
                path: 'backend/src/rpc/routers/{{kebabCase name}}.ts',
                templateFile: 'templates/feature/router.ts.hbs',
            },
            {
                type: 'modify',
                path: 'backend/src/rpc/routers/index.ts',
                pattern: /(import.*from.*;\n)(?!import)/,
                template: "$1import { build{{pascalCase name}} } from './{{kebabCase name}}.ts';\n",
            },
            {
                type: 'modify',
                path: 'backend/src/rpc/routers/index.ts',
                pattern: /(export const router = os\.use\(makeAppErrorMiddleware\(\)\)\.router\({)/,
                template: '$1\n    ...build{{pascalCase name}}(),',
            },
        ],
    });
}
