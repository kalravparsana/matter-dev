import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

test.describe('Login — Mobile', () => {
  test('sign-in button fits mobile viewport', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
  });
});
