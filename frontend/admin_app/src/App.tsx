import { useQuery } from '@tanstack/react-query';
import { StarterShell } from '@template/ui/starter-shell';
import { getPublicEnv } from '@/env';

export default function App() {
    const apiUrl = getPublicEnv().VITE_RPC_URL;
    const health = useQuery({
        queryKey: ['api-health', apiUrl],
        queryFn: async ({ signal }) => {
            const response = await fetch(`${apiUrl.replace(/\/$/, '')}/health`, { signal });
            if (!response.ok) {
                throw new Error('Health request failed');
            }
            const data: unknown = await response.json();
            if (typeof data !== 'object' || data === null || !('ok' in data) || data.ok !== true) {
                throw new Error('Unexpected health response');
            }
            return true;
        },
        retry: false,
        staleTime: 10_000,
    });
    return (
        <StarterShell
            area="operations"
            eyebrow="A clear view of your foundation"
            title="Know what you're running."
            description="A small operations surface, with live API reachability and an honest map of what belongs in your production application."
        >
            <div className="workspace-grid">
                <section className="panel" aria-labelledby="api-health-title">
                    <span className="panel-label">Live check / HTTP</span>
                    <h2 id="api-health-title">API connectivity</h2>
                    <p className="muted">
                        This request checks the HTTP health endpoint. It does not verify database,
                        Redis, or provider readiness.
                    </p>
                    <p className="status-line" role="status">
                        {health.isFetching ? (
                            'Checking the API…'
                        ) : health.isError ? (
                            'API could not be reached'
                        ) : health.data ? (
                            <>
                                <span className="status-dot" aria-hidden="true" />
                                API is reachable
                            </>
                        ) : (
                            'Not checked'
                        )}
                    </p>
                    <div className="record">
                        <dl>
                            <dt>Endpoint</dt>
                            <dd>
                                <code>{apiUrl.replace(/\/$/, '')}/health</code>
                            </dd>
                        </dl>
                    </div>
                    <button
                        className="button"
                        disabled={health.isFetching}
                        onClick={() => void health.refetch()}
                    >
                        Check again
                    </button>
                </section>
                <aside className="panel panel-dark">
                    <span className="panel-label">Before going live</span>
                    <h2>
                        An admin interface
                        <br />
                        isn't an auth boundary.
                    </h2>
                    <p className="muted">
                        This page is intentionally public and contains no privileged controls. The
                        template's anonymous sessions are demo-only. Add your identity provider,
                        authorization policy and audit trail before exposing administration.
                    </p>
                </aside>
            </div>
            <div className="card-row">
                <section className="panel">
                    <span className="feature-number">01 / Boundaries</span>
                    <h3>Contract first</h3>
                    <p className="muted">
                        Keep input validation and error contracts in the shared contracts workspace.
                    </p>
                </section>
                <section className="panel">
                    <span className="feature-number">02 / Persistence</span>
                    <h3>Explicit migrations</h3>
                    <p className="muted">
                        Version database changes with your feature. Test against an isolated
                        PostgreSQL instance.
                    </p>
                </section>
                <section className="panel">
                    <span className="feature-number">03 / Operations</span>
                    <h3>Observe real signals</h3>
                    <p className="muted">
                        Build on request IDs, structured logs and readiness checks. Avoid invented
                        success metrics.
                    </p>
                </section>
            </div>
        </StarterShell>
    );
}
