import { test, expect } from '@playwright/test';

const baseUrl = process.env.E2E_BASE_URL;

test.skip(!baseUrl, 'Set E2E_BASE_URL to run e2e tests');

test('landing page renders', async ({ page }) => {
    if (!baseUrl) {
        return;
    }
    await page.goto(baseUrl);
    await expect(page).toHaveTitle(/Monorepo Template/i);
});
