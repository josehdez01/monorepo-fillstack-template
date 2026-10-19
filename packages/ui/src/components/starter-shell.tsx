import type { ReactNode } from 'react';

export interface StarterShellProps {
    area: string;
    eyebrow: string;
    title: string;
    description: string;
    action?: ReactNode;
    children: ReactNode;
}

/** Shared application chrome; identity and business flows stay in their owning app. */
export function StarterShell({
    area,
    eyebrow,
    title,
    description,
    action,
    children,
}: StarterShellProps) {
    return (
        <div className="workspace">
            <a className="skip-link" href="#main">
                Skip to content
            </a>
            <header className="workspace-header">
                <a href="/" className="wordmark" aria-label={`${area} home`}>
                    <span className="brand-mark" aria-hidden="true">
                        f.
                    </span>
                    <span>
                        fillstack<span className="area-label"> / {area}</span>
                    </span>
                </a>
                <div className="header-action">
                    {action ?? <span className="pill">TypeScript, end to end</span>}
                </div>
            </header>
            <main id="main" className="workspace-main" tabIndex={-1}>
                <div className="page-intro">
                    <p className="eyebrow">{eyebrow}</p>
                    <h1>{title}</h1>
                    <p className="page-description">{description}</p>
                </div>
                {children}
            </main>
            <footer className="workspace-footer">
                <span>A foundation. Make it yours.</span>
                <span>React · oRPC · Hono · PostgreSQL</span>
            </footer>
        </div>
    );
}
