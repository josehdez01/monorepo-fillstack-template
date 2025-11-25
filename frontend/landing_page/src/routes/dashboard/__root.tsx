import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

// Use the folder's root path for the layout route
export const Route = createFileRoute('/dashboard/__root')({
    beforeLoad: ({ context }) => {
        if (!context.authed) {
            throw redirect({ to: '/' });
        }
    },
    component: () => (
        <div>
            <h2>Dashboard</h2>
            <Outlet />
        </div>
    ),
});
