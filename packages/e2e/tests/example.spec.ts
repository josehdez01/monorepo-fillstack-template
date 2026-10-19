import { test, expect } from '@playwright/test';

test('landing links to the live workspace and operations checks the live API', async ({
    page,
}, testInfo) => {
    await page.goto('http://127.0.0.1:5173');
    await expect(page).toHaveTitle('Fillstack — Start here');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('landing-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('landing-mobile.png'), fullPage: true });
    await page.getByRole('link', { name: /Explore the workspace/ }).click();
    await expect(page).toHaveURL('http://127.0.0.1:5175/');
    await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, world!');
    await page.goto('http://127.0.0.1:5174');
    await expect(page.getByRole('status')).toHaveText('API is reachable');
    await page.getByRole('button', { name: 'Check again' }).click();
    await expect(page.getByRole('status')).toHaveText('API is reachable');
    await expect(page.getByText(/intentionally public/)).toBeVisible();
});
