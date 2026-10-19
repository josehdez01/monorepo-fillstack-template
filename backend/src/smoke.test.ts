import { describe, it, expect } from 'vitest';
import { createApp } from './app.ts';

describe('HTTP boundary without dependencies', () => {
    it('returns liveness and readiness independently with correlated requests', async () => {
        const app = createApp({ ready: () => false });
        const health = await app.request('/health');
        expect(health.status).toBe(200);
        expect(await health.json()).toEqual({ ok: true });
        expect(health.headers.get('x-request-id')).toBeTruthy();
        expect((await app.request('/ready')).status).toBe(503);
    });
    it('allows only explicitly configured browser origins', async () => {
        const app = createApp({ allowedOrigins: ['https://frontend.example'] });
        const allowed = await app.request('/health', {
            headers: { origin: 'https://frontend.example' },
        });
        const denied = await app.request('/health', {
            headers: { origin: 'https://attacker.example' },
        });
        expect(allowed.headers.get('access-control-allow-origin')).toBe('https://frontend.example');
        expect(denied.headers.get('access-control-allow-origin')).toBeNull();
    });
});
