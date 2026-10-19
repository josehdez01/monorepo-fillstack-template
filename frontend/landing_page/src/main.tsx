import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen.ts';
import './styles.css';

const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
    const router = createRouter({ routeTree, context: {} });
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            <RouterProvider router={router} />
        </StrictMode>,
    );
}
