import { http, HttpResponse } from 'msw';

export const handlers = [
    http.post('/rpc/hello/greet', async () => {
        return HttpResponse.json({ json: 'Hello from msw!' });
    }),
];
