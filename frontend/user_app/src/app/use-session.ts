import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { orpc } from '@/api/orpc-client';

export interface UseSessionResult {
    hasSession: boolean;
    isLoading: boolean;
    error: unknown;
    retry: () => void;
}

function getInitialHasSession(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }
    try {
        return window.localStorage.getItem('sessionId') !== null;
    } catch {
        return false;
    }
}

function getUserAgent(): string | undefined {
    if (typeof navigator === 'undefined') {
        return undefined;
    }
    return navigator.userAgent;
}

export function useSession(): UseSessionResult {
    const [hasSession, setHasSession] = useState<boolean>(getInitialHasSession);
    const hasAttemptedRef = useRef(false);

    const { mutate, isPending, error } = useMutation(orpc.session.createSession.mutationOptions());

    useEffect(() => {
        if (hasSession || isPending || hasAttemptedRef.current || error) {
            return;
        }

        hasAttemptedRef.current = true;

        mutate(
            { userAgent: getUserAgent() },
            {
                onSuccess: (data) => {
                    if (typeof window !== 'undefined') {
                        window.localStorage.setItem('sessionId', data.sessionId);
                    }
                    setHasSession(true);
                },
            },
        );
    }, [hasSession, isPending, error, mutate]);

    const retry = () => {
        if (hasSession) {
            return;
        }

        mutate(
            { userAgent: getUserAgent() },
            {
                onSuccess: (data) => {
                    if (typeof window !== 'undefined') {
                        window.localStorage.setItem('sessionId', data.sessionId);
                    }
                    setHasSession(true);
                },
            },
        );
    };

    return {
        hasSession,
        isLoading: isPending,
        error,
        retry,
    };
}
