import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

for (const [name, url] of [
    ['workspace', 'http://127.0.0.1:5175'],
    ['operations', 'http://127.0.0.1:5174'],
    ['landing', 'http://127.0.0.1:5173'],
] as const) {
    test(`${name} has no WCAG A/AA violations in its initial interactive state`, async ({
        page,
    }) => {
        await page.goto(url);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        if (name === 'workspace') {
            await expect(page.getByTestId('orpc-hello')).toHaveText('Hello, world!');
        }
        if (name === 'operations') {
            await expect(page.getByRole('status')).toHaveText('API is reachable');
        }
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
}
