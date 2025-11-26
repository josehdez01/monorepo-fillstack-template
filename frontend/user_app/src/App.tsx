import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import HelloMessage from '@/components/hello-message';
import { Button } from '@template/ui/retroui';
import { orpc } from '@/api/orpc-client';

export default function App() {
    const [hasSession, setHasSession] = useState(() => !!localStorage.getItem('sessionId'));

    const { mutate: createSession, isPending } = useMutation(
        orpc.session.createSession.mutationOptions(),
    );

    useEffect(() => {
        if (!hasSession) {
            createSession(
                { userAgent: navigator.userAgent },
                {
                    onSuccess: (data) => {
                        localStorage.setItem('sessionId', data.sessionId);
                        setHasSession(true);
                    },
                    onError: (error) => {
                        console.error('Failed to create session:', error);
                    },
                },
            );
        }
    }, [createSession, hasSession]);

    if (isPending || !hasSession) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
                    <p className="text-gray-500 font-medium">Loading session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>Monorepo Template - User App</p>
                <HelloMessage />
                <Button style={{ marginTop: '1rem' }}>RetroUI Button</Button>
                <a
                    className="App-link"
                    href="https://tanstack.com"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn TanStack
                </a>
            </header>
        </div>
    );
}
