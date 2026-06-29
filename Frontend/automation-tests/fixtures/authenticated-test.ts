import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /continue with google/i }).click();
    await page.waitForURL(/\/today/);
    await use(page);
  },
});

export { expect };
