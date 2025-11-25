# Initial Setup Checklist (CLI‑First)

This checklist bootstraps the monorepo using only CLI commands. Each step
includes a short rationale. Run from the repo root unless noted.

## 1) Prerequisites

- [ ] Install tool versions (asdf) — ensures reproducible local env
    - Rationale: lock Node and pnpm versions across all contributors.
    - Commands:
        ```sh
        asdf plugin add nodejs || true
        asdf install
        corepack enable
        corepack prepare pnpm@10.20.0 --activate
        pnpm --version
        node --version
        ```

## 2) Initialize Workspace

- [ ] Create root package.json — marks workspace, ESM, engines
    - Rationale: central scripts + metadata for turbo and pnpm.
    - Commands:
        ```sh
        pnpm init -y
        pnpm pkg set name=@template/monorepo private=true type=module
        pnpm pkg set packageManager="pnpm@10.20.0"
        pnpm pkg set engines.node=">=24.11.0"
        ```

- [ ] Add workspace globs — declare projects
    - Rationale: pnpm discovers packages via this file.
    - Commands:
        ```sh
        cat > pnpm-workspace.yaml <<'YAML'
        packages:
          - backend
          - contracts
          - frontend/*
          - packages/*
        YAML
        ```

## 3) Core Dev Tooling

- [ ] Install root dev dependencies — turbo, ts, test, build, lint, format
    - Rationale: shared toolchain avoids per‑project duplication.
    - Commands:
        ```sh
        pnpm add -Dw turbo typescript vitest @vitest/coverage-v8 tsx tsdown prettier oxlint
        ```

- [ ] Create strict TS base config — ESM + NodeNext + strict rules
    - Rationale: single authoritative compiler baseline.
    - Commands:
        ```sh
        cat > tsconfig.base.json <<'JSON'
        {
          "compilerOptions": {
            "target": "ES2022",
            "lib": ["ES2022", "DOM"],
            "module": "NodeNext",
            "moduleResolution": "NodeNext",
            "jsx": "react-jsx",
            "strict": true,
            "noImplicitAny": true,
            "noUncheckedIndexedAccess": true,
            "exactOptionalPropertyTypes": true,
            "noImplicitOverride": true,
            "useUnknownInCatchVariables": true,
            "forceConsistentCasingInFileNames": true,
            "allowImportingTsExtensions": true,
            "declaration": true,
            "sourceMap": true,
            "skipLibCheck": true
          }
        }
        JSON
        ```

- [ ] Configure Turborepo pipelines — cache builds/tests and orchestrate dev
    - Rationale: fast local dev and CI with smart caching.
    - Commands:
        ```sh
        cat > turbo.json <<'JSON'
        {
          "$schema": "https://turbo.build/schema.json",
          "pipeline": {
            "build": { "dependsOn": ["^build"], "outputs": ["dist/**", "build/**"] },
            "typecheck": { "dependsOn": ["^typecheck"], "outputs": [] },
            "lint": { "outputs": [] },
            "format": { "outputs": [] },
            "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
            "dev": { "cache": false, "persistent": true }
          }
        }
        JSON
        ```

- [ ] Configure Vitest workspace — one entry to run all tests
    - Rationale: consistent test command across packages.
    - Commands:

        ```sh
        cat > vitest.workspace.ts <<'TS'
        import { defineWorkspace } from 'vitest/config';

        export default defineWorkspace([
          'backend',
          'contracts',
          'frontend/landing_page',
          'frontend/admin_app',
          'frontend/user_app',
          'packages/*'
        ]);
        TS
        ```

- [ ] Configure Prettier — formatting only
    - Rationale: keep formatting uniform; lint handles correctness.
    - Commands:
        ```sh
        cat > .prettierrc <<'JSON'
        {
          "semi": true,
          "singleQuote": true,
          "trailingComma": "all",
          "printWidth": 100
        }
        JSON
        printf "node_modules\n.dist\n.build\ncoverage\nmigrations\n" > .prettierignore
        ```

- [ ] Configure oxlint — strict TS linting (no any)
    - Rationale: fast, modern linter; enforce safety rules.
    - Commands:
        ```sh
        cat > .oxlintrc.json <<'JSON'
        {
          "$schema": "https://json.schemastore.org/oxlintrc",
          "linter": {
            "rules": {
              "typescript/no-explicit-any": "error",
              "typescript/no-floating-promises": "error",
              "typescript/no-misused-promises": "error",
              "unicorn/prefer-top-level-await": "warn"
            }
          },
          "typescript": { "enable": true }
        }
        JSON
        ```

- [ ] Add root scripts — convenience via turbo
    - Rationale: one‑liners to run common tasks.
    - Commands:
        ```sh
        pnpm pkg set scripts.dev="turbo run dev --filter='./backend' --parallel"
        pnpm pkg set scripts.dev:all="turbo run dev --parallel"
        pnpm pkg set scripts.build="turbo run build"
        pnpm pkg set scripts.test="turbo run test"
        pnpm pkg set scripts.lint="turbo run lint"
        pnpm pkg set scripts.format="turbo run format"
        pnpm pkg set scripts.typecheck="turbo run typecheck"
        ```

## 4) Local Infra (Docker)

- [ ] Start Postgres + Redis — local dev dependencies
    - Rationale: consistent local services with zero manual installs.
    - Commands:

        ```sh
        mkdir -p infra
        cat > infra/docker-compose.yml <<'YML'
        services:
          postgres:
            image: postgres:16
            ports: ["5432:5432"]
            environment:
              POSTGRES_USER: postgres
              POSTGRES_PASSWORD: postgres
              POSTGRES_DB: app
            volumes:
              - pgdata:/var/lib/postgresql/data

          redis:
            image: redis:7
            ports: ["6379:6379"]

        volumes:
          pgdata:
        YML
        docker compose -f infra/docker-compose.yml up -d
        ```

## 5) Contracts Package

- [ ] Scaffold package — ESM library
    - Rationale: shared orpc contracts + zod schemas consumed across apps.
    - Commands:
        ```sh
        mkdir -p contracts/src/{shared,frontend/{landing-page,admin-app,user-app},backend,integrations/{github,slack}}
        (cd contracts && pnpm init -y)
        pnpm --filter ./contracts pkg set name=@template/contracts type=module
        pnpm --filter ./contracts add zod orpc
        pnpm --filter ./contracts add -D typescript tsdown vitest
        cat > contracts/tsconfig.json <<'JSON'
        {
          "extends": "../tsconfig.base.json",
          "compilerOptions": { "composite": true, "outDir": "dist" },
          "include": ["src"]
        }
        JSON
        pnpm --filter ./contracts pkg set scripts.build="tsdown"
        pnpm --filter ./contracts pkg set scripts.test="vitest"
        pnpm --filter ./contracts pkg set scripts.lint="oxlint 'src/**/*.{ts,tsx}'"
        ```
    - Note: Replace `orpc` with your chosen package name if different.

## 6) Backend App

- [ ] Scaffold backend — Hono + Drizzle + BullMQ
    - Rationale: single app hosting API, webhooks, queues.
    - Commands:

        ```sh
        mkdir -p backend/src/{routes,orpc,integrations/{github,slack},queues,db,config}
        (cd backend && pnpm init -y)
        pnpm --filter ./backend pkg set name=@template/backend type=module
        pnpm --filter ./backend add hono @mikro-orm/core @mikro-orm/postgresql pg bullmq ioredis zod pino
        pnpm --filter ./backend add -D @mikro-orm/migrations @mikro-orm/reflection tsx tsdown vitest @types/node
        cat > backend/tsconfig.json <<'JSON'
        {
          "extends": "../tsconfig.base.json",
          "compilerOptions": {
            "composite": true,
            "outDir": "dist",
            "types": ["node"]
          },
          "include": ["src"]
        }
        JSON
        cat > backend/src/app.ts <<'TS'
        import { Hono } from 'hono';

        export const app = new Hono();

        app.get('/health', c => c.json({ ok: true }));
        TS
        cat > backend/src/index.ts <<'TS'
        import { app } from './app.ts';

        const port = Number(process.env.PORT ?? 3000);
        Bun && (await import('bun')); // no-op for ESM top-level-await friendliness
        export {}; // keep ESM mode explicit

        app.fire?.(); // in case future runtimes
        app.fetch?.;   // quiet unused warning

        const server = Bun?.serve
          ? null
          : app; // placeholder, real server wiring added later

        console.log(`Backend ready on :${port}`);
        TS
        cat > backend/.env.example <<'ENV'
        NODE_ENV=development
        PORT=3000
        DATABASE_URL=postgres://postgres:postgres@localhost:5432/app
        REDIS_URL=redis://localhost:6379
        GITHUB_WEBHOOK_SECRET=change-me
        SLACK_SIGNING_SECRET=change-me
        ENV
        cat > backend/mikro-orm.config.ts <<'TS'
        import { defineConfig } from '@mikro-orm/postgresql';

        export default defineConfig({
          clientUrl: process.env.DATABASE_URL,
          // dbName inferred from DATABASE_URL
          entities: ['./dist/src/db/*.js'],
          entitiesTs: ['./src/db/*.ts'],
          schemaGenerator: { createForeignKeyConstraints: false },
          migrations: { path: './migrations', glob: '!(*.d).{js,ts}' }
        });
        TS
        pnpm --filter ./backend pkg set scripts.dev="tsx --watch src/index.ts"
        pnpm --filter ./backend pkg set scripts.build="tsdown"
        pnpm --filter ./backend pkg set scripts.start="node dist/index.js"
        pnpm --filter ./backend pkg set scripts.db:migrate:create="mikro-orm migration:create"
        pnpm --filter ./backend pkg set scripts.db:migrate:up="mikro-orm migration:up"
        pnpm --filter ./backend pkg set scripts.db:migrate:down="mikro-orm migration:down"
        pnpm --filter ./backend pkg set scripts.test="vitest"
        pnpm --filter ./backend pkg set scripts.lint="oxlint 'src/**/*.{ts,tsx}'"
        ```

    - Note: Replace placeholder server wiring with your preferred runner (e.g.,
      `app.fire()` via `@hono/node-server`). The structure and scripts stay the
      same.
    - Note: MikroORM policy — use the `defineEntity` approach (no decorators) and
      avoid database‑level foreign keys. Enforce relationships in application code.

## 7) Frontend Apps (Vite + React + TanStack + Retro UI)

- [ ] Scaffold three apps — minimal templates
    - Rationale: fast boot with consistent stack.
    - Commands:

        ```sh
        pnpm dlx create-vite@latest frontend/landing_page --template react-swc-ts
        pnpm dlx create-vite@latest frontend/admin_app   --template react-swc-ts
        pnpm dlx create-vite@latest frontend/user_app    --template react-swc-ts

        pnpm --filter ./frontend/landing_page add @tanstack/react-router @tanstack/react-query zod
        pnpm --filter ./frontend/admin_app   add @tanstack/react-router @tanstack/react-query zod
        pnpm --filter ./frontend/user_app    add @tanstack/react-router @tanstack/react-query zod

        # Retro UI: install per library docs (placeholder name below)
        pnpm --filter ./frontend/landing_page add retroui
        pnpm --filter ./frontend/admin_app   add retroui
        pnpm --filter ./frontend/user_app    add retroui

        # Optional: shared UI package for wrappers later
        mkdir -p packages/ui/src
        (cd packages/ui && pnpm init -y && pnpm pkg set name=@template/ui type=module)
        ```

    - Note: Replace `retroui` with the actual package name(s) from Retro UI.

- [ ] Frontend env examples — API base URLs
    - Rationale: per‑app configuration without root env leakage.
    - Commands:
        ```sh
        printf "VITE_API_URL=http://localhost:3000\n" > frontend/landing_page/.env.example
        printf "VITE_API_URL=http://localhost:3000\n" > frontend/admin_app/.env.example
        printf "VITE_API_URL=http://localhost:3000\n" > frontend/user_app/.env.example
        ```

## 8) Root Hooks (Optional but Recommended)

- [ ] Git hooks via lefthook — fast pre‑commit checks
    - Rationale: catch issues early, keep main green.
    - Commands:
        ```sh
        pnpm add -Dw lefthook
        npx lefthook install
        cat > lefthook.yml <<'YML'
        pre-commit:
          parallel: true
          commands:
            lint:
              run: pnpm lint
            format:
              run: pnpm format -- --write
        pre-push:
          commands:
            typecheck:
              run: pnpm typecheck
            test:
              run: pnpm test -- --coverage
        YML
        ```

## 9) CI Pipeline (GitHub Actions)

- [ ] Add CI workflow — cache pnpm + turbo
    - Rationale: reliable builds with good performance out of the box.
    - Commands:
        ```sh
        mkdir -p .github/workflows
        cat > .github/workflows/ci.yml <<'YML'
        name: ci
        on:
          push:
            branches: [main]
          pull_request:
            branches: [main]
        jobs:
          build:
            runs-on: ubuntu-latest
            steps:
              - uses: actions/checkout@v4
              - uses: actions/setup-node@v4
                with:
                  node-version: 24.11.0
                  cache: 'pnpm'
              - uses: pnpm/action-setup@v4
                with:
                  version: 10.20.0
              - run: pnpm install --frozen-lockfile
              - run: pnpm lint
              - run: pnpm typecheck
              - run: pnpm test -- --coverage
              - run: pnpm build
        YML
        ```

## 10) Verify Everything

- [ ] Bring up services and install deps
    - Commands:
        ```sh
        docker compose -f infra/docker-compose.yml up -d
        pnpm install
        ```

- [ ] Run dev servers (example)
    - Commands:
        ```sh
        pnpm --filter ./backend dev
        pnpm --filter ./frontend/landing_page dev
        ```

- [ ] Smoke tests
    - Commands:
        ```sh
        pnpm lint
        pnpm typecheck
        pnpm test -- --coverage
        pnpm build
        ```

---

Notes

- We prefer importing workspace packages by package name (e.g.,
  `@template/contracts`) instead of TS path aliases to avoid bundler and runtime
  drift.
- `allowImportingTsExtensions` is enabled for dev with tsx. Built outputs are
  `.js`; bundlers/tsdown resolve extensions during build.

## 11) Encrypted Env Management (Commit Encrypted, Keep One Secret)

Choose one of the following approaches. We recommend SOPS + age.

### Option A — SOPS + age (recommended)

- Rationale: Tool‑agnostic, auditable, single private key per repo/environment.
- What you commit: per‑project `*.env.enc` and a `.sops.yaml` policy. Plaintext
  `*.env` stays ignored by git.

Steps (once per repo)

- [ ] Install tools
    ```sh
    # macOS (brew) or use your OS package manager
    brew install sops age || true
    ```
- [ ] Generate an age keypair (keep private key out of git)
    ```sh
    mkdir -p infra/age
    age-keygen -o infra/age/key.txt
    # Show public key (share in .sops.yaml recipients)
    grep -m1 public-key infra/age/key.txt | sed 's/# public-key: //'
    ```
- [ ] Add a SOPS policy file
    ```sh
    cat > .sops.yaml <<'YAML'
    creation_rules:
      - path_regex: ".*\\.env(\\.enc)?$"
        age: ["REPLACE_WITH_AGE_PUBLIC_KEY"]
    YAML
    ```

Encrypt/decrypt per project

- [ ] Create local envs from examples, then encrypt
    ```sh
    # example for backend
    cp backend/.env.example backend/.env
    # edit values, then encrypt to .env.enc and remove plaintext if desired
    sops --encrypt --age $(grep -m1 public-key infra/age/key.txt | sed 's/# public-key: //') \
      backend/.env > backend/.env.enc
    ```
- [ ] Decrypt locally when needed
    ```sh
    export SOPS_AGE_KEY="$(cat infra/age/key.txt)"
    sops -d backend/.env.enc > backend/.env
    ```

CI usage (GitHub Actions)

- [ ] Store `SOPS_AGE_KEY` secret in the repo/environment.
- [ ] Decrypt before build/test
    ```yaml
    - name: Decrypt env (backend)
      run: sops -d backend/.env.enc > backend/.env
      env:
          SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}
    ```

Git hygiene

- [ ] Ensure plaintext envs are ignored and encrypted are tracked
    ```sh
    echo "**/.env" >> .gitignore
    git add .sops.yaml backend/.env.enc
    ```

### Option B — Dotenv Vault

- Rationale: Purpose‑built for env files; commit `.env.vault` and use one
  `DOTENV_KEY` per environment.
- What you commit: per‑project `.env.vault`.

Steps (per project)

- [ ] Initialize and create vault
    ```sh
    pnpm add -Dw dotenv-vault dotenv
    # from each project directory (e.g., backend)
    cd backend
    npx dotenv-vault@latest new
    # push your .env into the vault
    npx dotenv-vault@latest push
    ```
- [ ] Commit `.env.vault` and ignore plaintext `.env`

Usage in dev/CI

- [ ] Set `DOTENV_KEY` (dev shell or CI secret), then load in code early
    ```ts
    // backend entrypoint (example)
    import 'dotenv-vault/config';
    ```
- [ ] Vite frontends continue to use `VITE_*` and do not contain secrets.
