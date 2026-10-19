import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import App from './App';

afterEach(cleanup);
function renderApp() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <App onRestartSession={vi.fn()} onEndSession={vi.fn()} />
        </QueryClientProvider>,
    );
}
describe('working demo', () => {
    it('sends an edited greeting through the typed API', async () => {
        const names: string[] = [];
        server.use(
            http.post('http://localhost:3000/rpc/hello/greet', async ({ request }) => {
                const { json } = (await request.json()) as { json: { name: string } };
                names.push(json.name);
                return HttpResponse.json({ json: `Hello, ${json.name}!` });
            }),
        );
        renderApp();
        await screen.findByText('Hello, world!');
        fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Ada' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send greeting' }));
        await screen.findByText('Hello, Ada!');
        expect(names).toEqual(['world', 'Ada']);
    });

    it('reads a created record back from the server rather than presenting a local echo', async () => {
        const id = 1;
        let lookedUp = false;
        server.use(
            http.post('http://localhost:3000/rpc/users/create', () =>
                HttpResponse.json({ json: { id, email: 'saved@example.com' } }),
            ),
            http.post('http://localhost:3000/rpc/users/getById', async ({ request }) => {
                const { json } = (await request.json()) as { json: { id: number } };
                expect(json.id).toBe(id);
                lookedUp = true;
                return HttpResponse.json({ json: { id, email: 'server@example.com' } });
            }),
        );
        renderApp();
        fireEvent.change(screen.getByLabelText('Email address'), {
            target: { value: 'saved@example.com' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Create demo account' }));
        await screen.findByText('server@example.com');
        expect(lookedUp).toBe(true);
        expect(screen.getByTestId('saved-account').textContent).toContain(String(id));
    });

    it('offers recovery after a greeting transport failure', async () => {
        let attempts = 0;
        server.use(
            http.post('http://localhost:3000/rpc/hello/greet', () => {
                attempts++;
                return attempts === 1
                    ? HttpResponse.error()
                    : HttpResponse.json({ json: 'Hello after retry!' });
            }),
        );
        renderApp();
        fireEvent.click(await screen.findByRole('button', { name: 'Retry greeting' }));
        await screen.findByText('Hello after retry!');
        await waitFor(() => expect(attempts).toBe(2));
    });
});
