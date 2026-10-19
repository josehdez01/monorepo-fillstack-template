import { expect, it } from 'vitest';
import { createLogger, withRequest } from './index.ts';

it('redacts credentials in structured logs while preserving request context', () => {
    const lines: string[] = [];
    const logger = createLogger(
        { level: 'info' },
        {
            write: (line) => {
                lines.push(line);
            },
        },
    );
    withRequest(logger, 'request-123').info(
        {
            password: 'secret-password',
            sessionId: 'private-session',
            req: {
                headers: {
                    authorization: 'Bearer abc',
                    cookie: 'session=abc',
                    'x-session-id': 'private-header',
                },
            },
            res: { headers: { 'set-cookie': 'session=abc' } },
            action: 'create',
        },
        'request',
    );
    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]!) as Record<string, unknown>;
    expect(entry).toMatchObject({
        reqId: 'request-123',
        action: 'create',
        password: '[REDACTED]',
        sessionId: '[REDACTED]',
    });
    expect(lines[0]).not.toMatch(
        /secret-password|private-session|Bearer abc|session=abc|private-header/,
    );
});
