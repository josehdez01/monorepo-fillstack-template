import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { StarterShell } from '@template/ui/starter-shell';
import { orpc } from '@/api/orpc-client';
import { hasErrorCode } from '@/app/session-store';

interface Props {
    onRestartSession: () => void;
    onEndSession: () => Promise<void>;
}

export default function App({ onRestartSession, onEndSession }: Props) {
    const [name, setName] = useState('world');
    const [submittedName, setSubmittedName] = useState('world');
    const [email, setEmail] = useState('');
    const [recordId, setRecordId] = useState<number>();
    const [ending, setEnding] = useState(false);
    const [endError, setEndError] = useState(false);
    const greeting = useQuery(
        orpc.hello.greet.queryOptions({ input: { name: submittedName }, retry: false }),
    );
    const create = useMutation(
        orpc.users.create.mutationOptions({ onSuccess: (data) => setRecordId(data.id) }),
    );
    const record = useQuery(
        orpc.users.getById.queryOptions({
            input: { id: recordId! },
            enabled: !!recordId,
            retry: false,
        }),
    );
    const expired = [greeting.error, create.error, record.error].some((error) =>
        hasErrorCode(error, 'UNAUTHORIZED'),
    );
    function submitGreeting(event: FormEvent) {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            return;
        }
        if (trimmed === submittedName) {
            void greeting.refetch();
        } else {
            setSubmittedName(trimmed);
        }
    }
    async function endSession() {
        setEnding(true);
        setEndError(false);
        try {
            await onEndSession();
        } catch {
            setEndError(true);
        } finally {
            setEnding(false);
        }
    }
    return (
        <StarterShell
            area="workspace"
            eyebrow="The full stack, in your hands"
            title="Small demo. Real foundation."
            description="Follow a request from a typed form to a Hono API and a PostgreSQL record. Then build something that matters."
            action={
                <button className="text-button" disabled={ending} onClick={() => void endSession()}>
                    {ending ? 'Ending session…' : 'End demo session'}
                </button>
            }
        >
            {expired && (
                <div role="alert" className="feedback feedback-error" style={{ marginBottom: 24 }}>
                    Your demo session expired or was revoked.{' '}
                    <button className="text-button" onClick={onRestartSession}>
                        Start a new session
                    </button>
                </div>
            )}
            {endError && (
                <p role="alert" className="feedback feedback-error">
                    Could not end the session. Try again when the API is available.
                </p>
            )}
            <div className="workspace-grid">
                <div className="stack">
                    <section className="panel" aria-labelledby="greeting-title">
                        <span className="panel-label">01 / Contract → API → query cache</span>
                        <h2 id="greeting-title">A proper introduction.</h2>
                        <p className="muted">
                            Send your name through a shared oRPC contract. No hand-written fetch
                            types.
                        </p>
                        <form onSubmit={submitGreeting}>
                            <div className="form-field">
                                <label htmlFor="name">Your name</label>
                                <input
                                    className="text-input"
                                    id="name"
                                    name="name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    required
                                    maxLength={100}
                                    autoComplete="given-name"
                                />
                            </div>
                            <button
                                className="button"
                                disabled={greeting.isFetching || !name.trim()}
                            >
                                {greeting.isFetching ? 'Sending…' : 'Send greeting'}
                            </button>
                        </form>
                        {greeting.isPending && (
                            <p role="status" className="feedback">
                                Waiting for the API…
                            </p>
                        )}
                        {greeting.data && (
                            <p role="status" data-testid="orpc-hello" className="feedback">
                                {greeting.data}
                            </p>
                        )}
                        {greeting.isError && !expired && (
                            <div role="alert" className="feedback feedback-error">
                                The greeting couldn't load.{' '}
                                <button
                                    className="text-button"
                                    onClick={() => void greeting.refetch()}
                                >
                                    Retry greeting
                                </button>
                            </div>
                        )}
                    </section>
                    <section className="panel" aria-labelledby="account-title">
                        <span className="panel-label">02 / Mutation → database → query</span>
                        <h2 id="account-title">Leave a little proof.</h2>
                        <p className="muted">
                            Create a demo account record. We read it back from the API, so you can
                            see the entire round trip.
                        </p>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                create.mutate({ email: email.trim() });
                            }}
                        >
                            <div className="form-field">
                                <label htmlFor="email">Email address</label>
                                <input
                                    className="text-input"
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                    maxLength={254}
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    aria-invalid={hasErrorCode(create.error, 'CONFLICT')}
                                    aria-describedby={
                                        create.isError ? 'account-error' : 'email-help'
                                    }
                                />
                                <span id="email-help" className="muted">
                                    Use sample data. This is not a sign-up or an authentication
                                    system.
                                </span>
                            </div>
                            <button className="button" disabled={create.isPending || expired}>
                                {create.isPending ? 'Saving…' : 'Create demo account'}
                            </button>
                        </form>
                        {create.isError && !expired && (
                            <p role="alert" id="account-error" className="feedback feedback-error">
                                {hasErrorCode(create.error, 'CONFLICT')
                                    ? 'That email already exists. Try another address.'
                                    : 'We could not save this record. Please try again.'}
                            </p>
                        )}
                        {record.isFetching && recordId && (
                            <p role="status" className="feedback">
                                Reading your saved record…
                            </p>
                        )}
                        {record.isError && !expired && (
                            <div role="alert" className="feedback feedback-error">
                                Saved, but we couldn't read the record back.{' '}
                                <button
                                    className="text-button"
                                    onClick={() => void record.refetch()}
                                >
                                    Retry reading record
                                </button>
                            </div>
                        )}
                        {record.data && (
                            <div className="record" data-testid="saved-account">
                                <p role="status">Saved and read back from PostgreSQL.</p>
                                <dl>
                                    <dt>Email</dt>
                                    <dd>{record.data.email}</dd>
                                    <dt>Record ID</dt>
                                    <dd>
                                        <code>{record.data.id}</code>
                                    </dd>
                                </dl>
                            </div>
                        )}
                    </section>
                </div>
                <aside className="stack" aria-label="About this workspace">
                    <section className="panel panel-dark">
                        <span className="panel-label">Built to be understood</span>
                        <h2>
                            One contract.
                            <br />
                            Every layer in sync.
                        </h2>
                        <p className="muted">
                            Inputs and responses travel through shared validation, typed clients and
                            query utilities. Change the contract; let your editor show you the rest.
                        </p>
                        <pre className="code-block">
                            {
                                'contracts/    define the boundary\nbackend/      implement the behavior\nfrontend/     build the experience\npackages/     share the essentials'
                            }
                        </pre>
                    </section>
                    <section className="panel panel-green">
                        <h3>What's actually happening?</h3>
                        <ol className="step-list">
                            <li>
                                <strong>Start a demo session</strong>
                                <p>
                                    An anonymous, expiring server-side session. Not a user identity.
                                </p>
                            </li>
                            <li>
                                <strong>Send a typed request</strong>
                                <p>
                                    oRPC validates the boundary; TanStack Query owns server state.
                                </p>
                            </li>
                            <li>
                                <strong>Persist and read</strong>
                                <p>
                                    MikroORM writes PostgreSQL, then the UI requests the saved
                                    record.
                                </p>
                            </li>
                        </ol>
                    </section>
                </aside>
            </div>
        </StarterShell>
    );
}
