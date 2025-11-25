import { Suspense, lazy } from 'react';
import { createFileRoute } from '@tanstack/react-router';

const Heavy = lazy(() => import('@/components/heavy'));

// Home route under /dashboard
export const Route = createFileRoute('/dashboard/home')({
    component: () => (
        <Suspense fallback={<div>Loading dashboard…</div>}>
            <Heavy />
        </Suspense>
    ),
});
