# Public landing page

A small, responsive product entry point at http://localhost:5173. It explains the stack and links to the independently deployed workspace and operations apps. It requires no API or session to render.

Run `pnpm dev:all` at the repository root, or `pnpm dev` here. Public deployment links are validated from explicit `import.meta.env`: `VITE_USER_APP_URL` defaults to http://localhost:5175 and `VITE_ADMIN_APP_URL` to http://localhost:5174. Set both for your deployment. Public variables must never contain secrets.

Scripts: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint:check`, `pnpm format:check`. The component test verifies accessible application links. Root browser tests follow those links into the live applications.

Use `@template/ui/starter-shell` for shared chrome and `@template/ui/starter.css` for the matching stylesheet. Landing content stays local. Router devtools load only in development.
