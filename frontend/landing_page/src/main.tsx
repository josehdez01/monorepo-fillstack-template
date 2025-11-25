import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen.ts';
import './styles.css';
import reportWebVitals from './reportWebVitals.ts';
import { makeClient } from '@/api/orpc-client';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';

const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
    const base = import.meta.env.VITE_RPC_URL || 'http://localhost:3000';
    const client = makeClient(base);
    const orpc = createTanstackQueryUtils(client);
    const router = createRouter({ routeTree, context: { client, orpc, authed: true } });
    const queryClient = new QueryClient();
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </StrictMode>,
    );
}

reportWebVitals();
