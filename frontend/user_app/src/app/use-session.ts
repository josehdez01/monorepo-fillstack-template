import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/api/orpc-client';
import { getSessionId, hasErrorCode, setSessionId } from './session-store';

async function establishSession(): Promise<void> {
    if (getSessionId()) {
        try {
            await client.hello.greet({ name: 'session-check' });
            return;
        } catch (error) {
            // A network failure is not permission to silently replace a valid session.
            if (!hasErrorCode(error, 'UNAUTHORIZED')) {
                throw error;
            }
            setSessionId(null);
        }
    }
    const { sessionId } = await client.session.createSession({ userAgent: navigator.userAgent });
    setSessionId(sessionId);
}

/** Demo lifecycle only. A stored ID is checked against the server before use. */
export function useSession() {
    const [hasSession, setHasSession] = useState(false);
    const attempted = useRef(false);
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: establishSession,
        retry: false,
        onSuccess: () => setHasSession(true),
    });
    const { mutate } = mutation;
    useEffect(() => {
        if (attempted.current) {
            return;
        }
        attempted.current = true;
        mutate();
    }, [mutate]);
    const restart = () => {
        setSessionId(null);
        setHasSession(false);
        queryClient.clear();
        mutate();
    };
    const end = async () => {
        try {
            await client.session.revokeSession({});
        } catch (error) {
            if (!hasErrorCode(error, 'UNAUTHORIZED')) {
                throw error;
            }
        }
        setSessionId(null);
        queryClient.clear();
        setHasSession(false);
        mutation.reset();
    };
    return {
        hasSession,
        isLoading: mutation.isPending || !attempted.current,
        error: mutation.error,
        retry: () => mutate(),
        restart,
        end,
    };
}
