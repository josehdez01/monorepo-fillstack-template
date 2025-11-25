import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen.ts';
import './styles.css';
import reportWebVitals from './reportWebVitals.ts';
import { makeClient } from '@/api/orpc-client';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { parseViteEnv } from '@template/env';
import { z } from 'zod';

const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
    const env = parseViteEnv({
        VITE_RPC_URL: z.string().url().default('http://localhost:3000'),
    });
    const client = makeClient(env.VITE_RPC_URL);
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
