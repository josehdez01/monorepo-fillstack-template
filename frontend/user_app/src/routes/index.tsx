import { createFileRoute } from '@tanstack/react-router';
import { StarterShell } from '@template/ui/starter-shell';
import App from '@/App';
import { useSession } from '@/app/use-session';

function IndexRouteComponent() {
    const { hasSession, isLoading, error, retry, restart, end } = useSession();
    if (hasSession) {
        return <App onRestartSession={restart} onEndSession={end} />;
    }
    return (
        <StarterShell
            area="workspace"
            eyebrow="Your working example"
            title="Let's get connected."
            description="A real API, a real database, and a small place to try them together."
        >
            <section className="panel center-state" aria-label="Demo session">
                {isLoading ? (
                    <p role="status">Starting your demo session…</p>
                ) : error ? (
                    <>
                        <h2>We couldn't connect.</h2>
                        <p className="muted">
                            Check that the API is running and demo sessions are enabled. Your
                            existing data is safe.
                        </p>
                        <button className="button" onClick={retry}>
                            Try again
                        </button>
                    </>
                ) : (
                    <>
                        <h2>Your demo session has ended.</h2>
                        <p className="muted">
                            The server revoked this session. Start a fresh one to keep exploring.
                        </p>
                        <button className="button" onClick={restart}>
                            Start a demo session
                        </button>
                    </>
                )}
            </section>
        </StarterShell>
    );
}
export const Route = createFileRoute('/')({ component: IndexRouteComponent });
