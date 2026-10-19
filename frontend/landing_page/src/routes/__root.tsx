import { createRootRouteWithContext, Outlet, Link } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import type { RouterContext } from '@/app/router-context';
const Devtools = import.meta.env.DEV
    ? lazy(() =>
          import('@tanstack/react-router-devtools').then((module) => ({
              default: module.TanStackRouterDevtools,
          })),
      )
    : null;
export const Route = createRootRouteWithContext<RouterContext>()({
    component: () => (
        <>
            <Outlet />
            {Devtools && (
                <Suspense fallback={null}>
                    <Devtools />
                </Suspense>
            )}
        </>
    ),
    notFoundComponent: () => (
        <main className="panel center-state">
            <h1>Page not found.</h1>
            <p>This address isn't part of this app.</p>
            <Link className="button" to="/">
                Back home
            </Link>
        </main>
    ),
    errorComponent: ({ reset }) => (
        <main className="panel center-state" role="alert">
            <h1>Something went wrong.</h1>
            <p>Try this page again. If it keeps happening, check the application logs.</p>
            <button className="button" onClick={reset}>
                Try again
            </button>
        </main>
    ),
});
