import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import App from './App';
afterEach(cleanup);
it('reports API availability from a real health response and allows retry', async () => {
    let requests = 0;
    server.use(
        http.get('http://localhost:3000/health', () => {
            requests++;
            return requests === 1 ? HttpResponse.error() : HttpResponse.json({ ok: true });
        }),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <QueryClientProvider client={client}>
            <App />
        </QueryClientProvider>,
    );
    await screen.findByText('API could not be reached');
    fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
    expect(await screen.findByText('API is reachable')).toBeDefined();
});
describe('operations boundaries', () => {
    it('does not present demo sessions as administration credentials', () => {
        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <App />
            </QueryClientProvider>,
        );
        expect(screen.getByText(/intentionally public/)).toBeDefined();
    });
});
