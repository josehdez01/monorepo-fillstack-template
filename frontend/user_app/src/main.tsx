import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen.ts';
import './styles.css';
import reportWebVitals from './reportWebVitals.ts';

const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
    const router = createRouter({ routeTree, context: { authed: true } });
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
