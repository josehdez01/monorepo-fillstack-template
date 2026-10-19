import { StarterShell } from '@template/ui/starter-shell';
import { getPublicEnv } from '@/env';

export default function App() {
    const env = getPublicEnv();
    return (
        <StarterShell
            area="start here"
            eyebrow="Less setup. More building."
            title="A thoughtful start for your next big thing."
            description="A TypeScript foundation with clear boundaries, a working request-to-database example, and room for your own ideas."
        >
            <div className="workspace-grid">
                <section className="panel panel-dark">
                    <span className="panel-label">Ready for your first feature</span>
                    <h2>
                        Your whole stack.
                        <br />
                        On the same page.
                    </h2>
                    <p className="muted">
                        React at the edge of the experience. Hono at the API boundary. PostgreSQL at
                        the source of truth. Shared contracts to connect the pieces.
                    </p>
                    <div className="hero-actions">
                        <a className="button button-light" href={env.VITE_USER_APP_URL}>
                            Explore the workspace <span aria-hidden="true">↗</span>
                        </a>
                        <a className="button button-light" href={env.VITE_ADMIN_APP_URL}>
                            View operations <span aria-hidden="true">↗</span>
                        </a>
                    </div>
                    <pre className="code-block">{'pnpm install\npnpm setup\npnpm dev:all'}</pre>
                </section>
                <section className="panel panel-green">
                    <span className="panel-label">A useful starting point</span>
                    <h2>
                        Small by design.
                        <br />
                        Connected for real.
                    </h2>
                    <ol className="step-list">
                        <li>
                            <strong>A working vertical slice</strong>
                            <p>
                                Start a demo session, send a greeting, and create a database record.
                            </p>
                        </li>
                        <li>
                            <strong>Shared foundations</strong>
                            <p>
                                Reusable UI, validated environments and structured logging across
                                workspaces.
                            </p>
                        </li>
                        <li>
                            <strong>Confidence as you grow</strong>
                            <p>
                                Unit, integration and browser tests exercise the boundaries that
                                matter.
                            </p>
                        </li>
                    </ol>
                </section>
            </div>
            <div className="card-row">
                <section className="panel">
                    <span className="feature-number">01</span>
                    <h3>Types that travel</h3>
                    <p className="muted">
                        Standardize the API contract once. Infer the client, validate requests and
                        keep responses aligned.
                    </p>
                </section>
                <section className="panel">
                    <span className="feature-number">02</span>
                    <h3>Apps with a purpose</h3>
                    <p className="muted">
                        A public landing page, an interactive workspace and an operations surface.
                        Share essentials, own features.
                    </p>
                </section>
                <section className="panel">
                    <span className="feature-number">03</span>
                    <h3>No magic identity</h3>
                    <p className="muted">
                        Demo sessions are clearly bounded. Bring real authentication and permissions
                        when your product needs them.
                    </p>
                </section>
            </div>
        </StarterShell>
    );
}
