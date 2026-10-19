const KEY = 'sessionId';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let memory: string | null = null;
let memoryOnly = false;

/** Browser storage is optional: private browsing can reject both reads and writes. */
export function getSessionId(): string | null {
    if (memoryOnly) {
        return memory;
    }
    let value = memory;
    try {
        value = window.localStorage.getItem(KEY);
        memory = value && UUID.test(value) ? value : null;
    } catch {
        /* Keep the in-memory session. */
    }
    return value && UUID.test(value) ? value : null;
}
export function setSessionId(value: string | null): void {
    memory = value;
    try {
        if (value) {
            window.localStorage.setItem(KEY, value);
        } else {
            window.localStorage.removeItem(KEY);
        }
        memoryOnly = false;
    } catch {
        memoryOnly = true;
        /* An in-memory session lasts until this tab reloads. */
    }
}
export function hasErrorCode(error: unknown, code: string): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}
