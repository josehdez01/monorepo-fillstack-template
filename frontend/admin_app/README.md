# Operations app

An intentionally public operations starting point at http://localhost:5174. It checks the real `/health` endpoint and distinguishes pending, unreachable and reachable states. An HTTP success is not a claim that PostgreSQL, Redis or external providers are ready.

There are no privileged controls or pretend admin credentials. Add an identity provider, server-side permission checks and an audit policy before introducing administration.

Run `pnpm dev:all` at the root, or `pnpm dev` here with the API already running. `VITE_RPC_URL` defaults to http://localhost:3000 and is validated from explicit `import.meta.env`. Never put secrets in public Vite variables.

Scripts: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint:check`, `pnpm format:check`. Tests simulate transport failure and verify the retry reaches the health endpoint. Shared chrome/styles live in `@template/ui/starter-shell` and `@template/ui/starter.css`; app behavior stays here. Router devtools load only in development.
