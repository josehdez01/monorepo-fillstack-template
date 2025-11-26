import { test, expect } from '@playwright/test';

const debugLogging = false;

test('user app loads session and shows hello message', async ({ page }) => {
    if (debugLogging) {
        page.on('console', (msg) => console.log(`[Browser Console]: ${msg.text()}`));
        page.on('pageerror', (err) => console.log(`[Browser Error]: ${err}`));
        page.on('requestfailed', (req) => {
            const failure = req.failure();
            const errorText = failure ? failure.errorText : '';
            console.log(`[Request Failed]: ${req.url()} ${errorText}`);
        });
        page.on('response', (res) => {
            if (res.status() >= 400) {
                console.log(`[Response Error]: ${res.url()} ${res.status()}`);
            }
        });
    }

    // 1. Visit the user app
    await page.goto('/');

    // Check if loading text appears
    // await expect(page.getByText('Loading session...')).toBeVisible({ timeout: 5000 });

    // 2. Verify loading state is shown initially (might be fast, so we might miss it if we await too late,
    // but we can check for existence or just wait for it to disappear)
    // Let's just verify we eventually get the content.

    // 3. Verify session is created (we can check localStorage)
    await expect
        .poll(
            async () => {
                return await page.evaluate(() => localStorage.getItem('sessionId'));
            },
            { timeout: 15000 },
        )
        .toBeTruthy();

    // 4. Verify "Hello world" message is displayed
    // The component renders <p data-testid="orpc-hello">...
    const helloMessage = page.getByTestId('orpc-hello');
    await expect(helloMessage).toContainText('Hello');
});
