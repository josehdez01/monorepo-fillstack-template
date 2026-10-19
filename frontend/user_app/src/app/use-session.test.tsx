import { StrictMode, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from './use-session';
import { getSessionId, setSessionId } from './session-store';
const api = vi.hoisted(() => ({ create: vi.fn(), greet: vi.fn(), revoke: vi.fn() }));
vi.mock('@/api/orpc-client', () => ({
    client: {
        session: { createSession: api.create, revokeSession: api.revoke },
        hello: { greet: api.greet },
    },
}));
const id = '019a5f83-f670-7000-8000-000000000001';
const oldId = '019a5f83-f670-7000-8000-000000000002';
function wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return (
        <StrictMode>
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </StrictMode>
    );
}
beforeEach(() => {
    setSessionId(null);
    vi.clearAllMocks();
    api.create.mockResolvedValue({ sessionId: id });
    api.greet.mockResolvedValue('Hello!');
    api.revoke.mockResolvedValue({ revoked: true });
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    setSessionId(null);
});
describe('demo session bootstrap', () => {
    it('creates once under StrictMode and persists the returned session', async () => {
        const { result } = renderHook(useSession, { wrapper });
        await waitFor(() => expect(result.current.hasSession).toBe(true));
        expect(api.create).toHaveBeenCalledTimes(1);
        expect(getSessionId()).toBe(id);
    });
    it('validates and reuses a stored session', async () => {
        setSessionId(oldId);
        const { result } = renderHook(useSession, { wrapper });
        await waitFor(() => expect(result.current.hasSession).toBe(true));
        expect(api.greet).toHaveBeenCalledOnce();
        expect(api.create).not.toHaveBeenCalled();
        expect(getSessionId()).toBe(oldId);
    });
    it('replaces a revoked session only after an unauthorized response', async () => {
        setSessionId(oldId);
        api.greet.mockRejectedValueOnce({ code: 'UNAUTHORIZED' });
        const { result } = renderHook(useSession, { wrapper });
        await waitFor(() => expect(result.current.hasSession).toBe(true));
        expect(api.create).toHaveBeenCalledOnce();
        expect(getSessionId()).toBe(id);
    });
    it('keeps the old session on network errors and supports an explicit retry', async () => {
        setSessionId(oldId);
        api.greet.mockRejectedValueOnce(new Error('offline'));
        const { result } = renderHook(useSession, { wrapper });
        await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
        expect(api.create).not.toHaveBeenCalled();
        expect(getSessionId()).toBe(oldId);
        act(() => result.current.retry());
        await waitFor(() => expect(result.current.hasSession).toBe(true));
        expect(api.greet).toHaveBeenCalledTimes(2);
    });
    it('recovers from malformed stored data without sending it to the API', async () => {
        localStorage.setItem('sessionId', 'not-a-session');
        const { result } = renderHook(useSession, { wrapper });
        await waitFor(() => expect(result.current.hasSession).toBe(true));
        expect(api.greet).not.toHaveBeenCalled();
        expect(getSessionId()).toBe(id);
    });
    it('supports storage-denied browsers using an in-memory session', async () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('denied');
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('denied');
        });
        const { result } = renderHook(useSession, { wrapper });
        await waitFor(() => expect(result.current.hasSession).toBe(true));
        expect(getSessionId()).toBe(id);
    });
    it('keeps the memory token when storage reads succeed but quota blocks writes', async () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('Quota exceeded', 'QuotaExceededError');
        });
        const { result } = renderHook(useSession, { wrapper });
        await waitFor(() => expect(result.current.hasSession).toBe(true));
        expect(localStorage.getItem('sessionId')).toBeNull();
        expect(getSessionId()).toBe(id);
    });
    it('clears credentials when ending an already revoked or expired session', async () => {
        const { result } = renderHook(useSession, { wrapper });
        await waitFor(() => expect(result.current.hasSession).toBe(true));
        api.revoke.mockRejectedValueOnce({ code: 'UNAUTHORIZED' });
        await act(async () => {
            await result.current.end();
        });
        expect(result.current.hasSession).toBe(false);
        expect(getSessionId()).toBeNull();
    });
    it('preserves the usable session when revocation fails due to transport', async () => {
        const { result } = renderHook(useSession, { wrapper });
        await waitFor(() => expect(result.current.hasSession).toBe(true));
        const error = new Error('offline');
        api.revoke.mockRejectedValueOnce(error);
        await expect(result.current.end()).rejects.toBe(error);
        expect(result.current.hasSession).toBe(true);
        expect(getSessionId()).toBe(id);
    });
    it('revokes server-side and clears local credentials without automatically recreating', async () => {
        const { result } = renderHook(useSession, { wrapper });
        await waitFor(() => expect(result.current.hasSession).toBe(true));
        await act(async () => {
            await result.current.end();
        });
        expect(result.current.hasSession).toBe(false);
        expect(getSessionId()).toBeNull();
        expect(api.revoke).toHaveBeenCalledOnce();
        expect(api.create).toHaveBeenCalledOnce();
    });
});
