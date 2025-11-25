# @template/ui

Shared UI kit for template apps. Components are exported in two styles:

- `@template/ui/retroui/*` — opinionated ready-to-ship components.
- `@template/ui/shadcn/*` — lighter primitives aligned with shadcn/ui naming.
- `@template/ui` — convenience re-exports of common buttons.

## Styling

- This package assumes Tailwind v4+ is available in the consuming app.
- Import your app’s Tailwind entry (e.g., `@import 'tailwindcss';`) and include any theme tokens you need. The kit does not auto-inject CSS; you own global styles.
- If you want to mirror the provided design tokens, start from `packages/ui/src/styles.css` as inspiration and copy variables into your app.

## Usage

```ts
import { Button } from '@template/ui';
// or
import { Button as RetroButton } from '@template/ui/retroui/Button';
import { Button as ShadcnButton } from '@template/ui/shadcn/button';
```

- `tailwindcss` (tested with v4+)

## Adding Components

This package is configured with `shadcn/ui`. To add a new component:

```bash
cd packages/ui
npx shadcn@latest add button
```

The component will be placed in `src/retroui` (aliased as `@/retroui`).
You can then export it from `src/index.ts` or `src/retroui/index.ts` to make it available to consumers.
