# Workspace app

A real, bounded demo of the full stack: start an anonymous session, send a greeting, create a sample account record, and read it back from PostgreSQL. The session is **not user authentication**; the backend disables demo access in production.

Run `pnpm dev:all` from the repository root, then open http://localhost:5175. Run infrastructure and migrations as described in the root README first. This app alone starts with `pnpm dev`; it needs the API at `VITE_RPC_URL` (default http://localhost:3000).

`src/api/orpc-client.ts` owns transport and inferred query utilities. `src/app/use-session.ts` owns demo session bootstrap, stale-token verification, revocation and explicit recovery. Browser storage is optional; blocked storage uses a tab-local fallback. Successful query data stays in TanStack Query, not duplicated component state.

`App.tsx` demonstrates typed mutations and dependent reads, server-declared conflicts, pending states and recoverable transport failures. `@template/ui/starter-shell` supplies shared accessible chrome. Keep feature behavior in this app rather than moving it into the component package.

Scripts: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint:check`, `pnpm format:check`. Unit tests run with deterministic MSW endpoints and require no services. Root `pnpm test:e2e` exercises the real API/database in disposable infrastructure.

Public configuration is parsed from explicit `import.meta.env`: `VITE_RPC_URL`, and `VITE_ORPC_VALIDATE_REQUESTS` (`true` by default; `false` disables client-side validation, never server-side validation). Never place secrets in `VITE_*` variables. Production builds exclude router devtools.
