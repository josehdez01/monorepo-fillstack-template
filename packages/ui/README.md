# @template/ui

Shared UI kit for template apps. Components are exported in two styles, plus the shared application shell:

- `@template/ui/retroui/*` — opinionated ready-to-ship components.
- `@template/ui/shadcn/*` — lighter primitives aligned with shadcn/ui naming.
- `@template/ui/starter-shell` — accessible application chrome; import `@template/ui/starter.css` for its stylesheet.
- There is intentionally no default `@template/ui` root export; apps must choose which family to use via the import path.

## Styling

- This package assumes Tailwind v4+ is available in the consuming app.
- Import your app’s Tailwind entry (e.g., `@import 'tailwindcss';`) and include any theme tokens you need. The kit does not auto-inject CSS; you own global styles.
- Import `@template/ui/theme.css` after Tailwind for the shared light/dark component tokens. The shell stylesheet uses the same palette. Override these variables in your app when building your product identity.

## Usage

```ts
// Retro-style components
import { Button as RetroButton } from '@template/ui/retroui/Button';
// or via the retroui index:
import { Button as RetroButtonFromIndex } from '@template/ui/retroui';

// shadcn-style primitives
import { Button as ShadcnButton } from '@template/ui/shadcn/button';
// or via the shadcn index:
import { Button as ShadcnButtonFromIndex } from '@template/ui/shadcn';
```

- `tailwindcss` (tested with v4+)

## Adding Components

This package is configured with `shadcn/ui`. To add a new component:

```bash
cd packages/ui
npx shadcn@latest add button
```

New primitives are placed in `src/shadcn/ui`. Export them from `src/shadcn/index.ts` if a barrel import is useful. Keep internal imports relative or use the package’s own exported paths; application-specific aliases such as `@/lib/utils` do not work when a consuming app typechecks shared source.

## Validation and upgrades

`pnpm typecheck` checks every production component, not only utility helpers. Preview examples are excluded from the production build and declaration generation. Build output uses browser ESM with `.js` / `.d.ts` matching package exports. Development exports resolve directly to source for editor checking and HMR.

The resizable primitives target react-resizable-panels 4 (`Group`, `Panel`, `Separator`): use `orientation`, and consult its current sizing API when adopting the component. Chart tooltip/legend wrappers use Recharts 3 content props; the calendar uses DayPicker 10 class names.
