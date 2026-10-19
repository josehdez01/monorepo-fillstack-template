import { http, HttpResponse } from 'msw';
export const handlers = [
    http.post('http://localhost:3000/rpc/hello/greet', () =>
        HttpResponse.json({ json: 'Hello, world!' }),
    ),
];
