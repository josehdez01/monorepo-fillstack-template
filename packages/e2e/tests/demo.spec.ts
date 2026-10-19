import { randomUUID } from 'node:crypto';
import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
const api = 'http://127.0.0.1:4300';
async function rpc(request: APIRequestContext, path: string, input: unknown, sessionId?: string) {
    return request.post(`${api}/rpc/${path}`, {
        data: { json: input },
        headers: sessionId ? { 'x-session-id': sessionId } : {},
    });
}
async function ready(page: Page) {
    await page.goto('/');
    await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, world!');
    const session = await page.evaluate(() => localStorage.getItem('sessionId'));
    expect(session).toMatch(/^[0-9a-f-]{36}$/);
    return session!;
}

test('typed browser mutation persists a record and a separate API read retrieves it', async ({
    page,
    request,
}) => {
    const session = await ready(page);
    await page.getByLabel('Your name').fill('Ada');
    await page.getByRole('button', { name: 'Send greeting' }).click();
    await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, Ada!');
    const email = `e2e-${randomUUID()}@example.com`;
    await page.getByLabel('Email address').fill(email);
    await page.getByRole('button', { name: 'Create demo account' }).click();
    const record = page.getByTestId('saved-account');
    await expect(record).toContainText('Saved and read back from PostgreSQL.');
    await expect(record).toContainText(email);
    const id = Number(await record.locator('code').innerText());
    const response = await rpc(request, 'users/getById', { id }, session);
    expect(response.ok()).toBe(true);
    expect(await response.json()).toMatchObject({ json: { id, email } });
    await page.reload();
    await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, world!');
    expect(await page.evaluate(() => localStorage.getItem('sessionId'))).toBe(session);
    const persisted = await rpc(request, 'users/getById', { id }, session);
    expect(await persisted.json()).toMatchObject({ json: { id, email } });
});

test('duplicate records show the declared conflict and the form remains usable', async ({
    page,
}) => {
    await ready(page);
    const email = `duplicate-${randomUUID()}@example.com`;
    await page.getByLabel('Email address').fill(email);
    await page.getByRole('button', { name: 'Create demo account' }).click();
    await expect(page.getByTestId('saved-account')).toContainText(email);
    await page.getByRole('button', { name: 'Create demo account' }).click();
    await expect(page.getByRole('alert')).toContainText('That email already exists');
    await expect(page.getByLabel('Email address')).toHaveAttribute('aria-invalid', 'true');
    const replacement = `replacement-${randomUUID()}@example.com`;
    await page.getByLabel('Email address').fill(replacement);
    await page.getByRole('button', { name: 'Create demo account' }).click();
    await expect(page.getByTestId('saved-account')).toContainText(replacement);
});

test('a revoked stored session is checked and replaced after reload', async ({ page, request }) => {
    const original = await ready(page);
    const revoked = await rpc(request, 'session/revokeSession', {}, original);
    expect(revoked.ok()).toBe(true);
    await page.reload();
    await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, world!');
    expect(await page.evaluate(() => localStorage.getItem('sessionId'))).not.toBe(original);
    const rejected = await rpc(request, 'hello/greet', { name: 'old session' }, original);
    expect(rejected.status()).toBe(401);
});

test('ending a demo session revokes it and does not silently sign back in', async ({
    page,
    request,
}) => {
    const original = await ready(page);
    await page.getByRole('button', { name: 'End demo session' }).click();
    await expect(page.getByRole('heading', { name: 'Your demo session has ended.' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('sessionId'))).toBeNull();
    expect((await rpc(request, 'hello/greet', { name: 'revoked' }, original)).status()).toBe(401);
    await page.getByRole('button', { name: 'Start a demo session', exact: true }).click();
    await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, world!');
    expect(await page.evaluate(() => localStorage.getItem('sessionId'))).not.toBe(original);
});

test('a transport failure has a visible retry path that reaches the live API', async ({ page }) => {
    await ready(page);
    let failed = false;
    await page.route('**/rpc/hello/greet', async (route) => {
        if (!failed) {
            failed = true;
            await route.abort('connectionfailed');
        } else {
            await route.continue();
        }
    });
    await page.getByLabel('Your name').fill('Grace');
    await page.getByRole('button', { name: 'Send greeting' }).click();
    await expect(page.getByRole('button', { name: 'Retry greeting' })).toBeVisible();
    await page.getByRole('button', { name: 'Retry greeting' }).click();
    await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, Grace!');
});

test('malformed persisted credentials recover and keyboard navigation starts at the skip link', async ({
    page,
}) => {
    await page.addInitScript(() => localStorage.setItem('sessionId', 'malformed'));
    await page.goto('/');
    await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, world!');
    expect(await page.evaluate(() => localStorage.getItem('sessionId'))).not.toBe('malformed');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
});

test('the API enforces session and input boundaries independently of browser validation', async ({
    request,
}) => {
    expect((await rpc(request, 'users/create', { email: 'valid@example.com' })).status()).toBe(401);
    const created = await rpc(request, 'session/createSession', {});
    expect(created.ok()).toBe(true);
    const {
        json: { sessionId },
    } = await created.json();
    expect((await rpc(request, 'users/create', { email: 'invalid' }, sessionId)).status()).toBe(
        400,
    );
    expect((await rpc(request, 'hello/greet', { name: 'test' }, 'not-a-uuid')).status()).toBe(401);
    await rpc(request, 'session/revokeSession', {}, sessionId);
});

test('workspace stays usable on a narrow screen and does not expose its bearer token', async ({
    page,
}, testInfo) => {
    const session = await ready(page);
    await expect(page.locator('body')).not.toContainText(session);
    await page.screenshot({ path: testInfo.outputPath('workspace-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByLabel('Your name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create demo account' })).toBeVisible();
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('workspace-mobile.png'), fullPage: true });
});

test('a live session revocation offers an explicit recovery path without reloading', async ({
    page,
    request,
}) => {
    const original = await ready(page);
    expect((await rpc(request, 'session/revokeSession', {}, original)).ok()).toBe(true);
    await page.getByLabel('Your name').fill('New request');
    await page.getByRole('button', { name: 'Send greeting' }).click();
    await expect(page.getByRole('alert')).toContainText('expired or was revoked');
    await page.getByRole('button', { name: 'Start a new session', exact: true }).click();
    await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, world!');
    expect(await page.evaluate(() => localStorage.getItem('sessionId'))).not.toBe(original);
});

test('blocked browser storage still supports a tab-local demo session and real mutations', async ({
    page,
}) => {
    await page.addInitScript(() => {
        for (const method of ['getItem', 'setItem', 'removeItem']) {
            Object.defineProperty(Storage.prototype, method, {
                value() {
                    throw new DOMException('Storage blocked', 'SecurityError');
                },
            });
        }
    });
    await page.goto('/');
    await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, world!');
    await page.getByLabel('Your name').fill('Private browsing');
    await page.getByRole('button', { name: 'Send greeting' }).click();
    await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, Private browsing!');
    await page.getByRole('button', { name: 'End demo session' }).click();
    await expect(page.getByRole('heading', { name: 'Your demo session has ended.' })).toBeVisible();
});

test('write-denied storage keeps its in-memory credential even when reads remain available', async ({
    page,
}) => {
    await page.addInitScript(() => {
        Object.defineProperty(Storage.prototype, 'setItem', {
            value() {
                throw new DOMException('Quota exceeded', 'QuotaExceededError');
            },
        });
    });
    await page.goto('/');
    await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, world!');
    expect(await page.evaluate(() => localStorage.getItem('sessionId'))).toBeNull();
    await page.getByLabel('Your name').fill('Quota fallback');
    await page.getByRole('button', { name: 'Send greeting' }).click();
    await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, Quota fallback!');
});
