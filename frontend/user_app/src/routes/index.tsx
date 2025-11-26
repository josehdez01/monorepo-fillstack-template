import { createFileRoute } from '@tanstack/react-router';
import App from '@/App';
import { useSession } from '@/app/use-session';

function IndexRouteComponent() {
    const { hasSession, isLoading, error, retry } = useSession();

    if (isLoading || (!hasSession && !error)) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
                    <p className="text-gray-500 font-medium">Loading session...</p>
                </div>
            </div>
        );
    }

    if (error && !hasSession) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <p className="text-red-500 font-medium">Failed to load session.</p>
                    <button
                        type="button"
                        onClick={retry}
                        className="rounded bg-blue-600 px-4 py-2 text-white"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return <App />;
}

export const Route = createFileRoute('/')({
    component: IndexRouteComponent,
});
