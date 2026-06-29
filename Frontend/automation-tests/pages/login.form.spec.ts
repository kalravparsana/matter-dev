import { test, expect } from '@playwright/test';

test.describe('Login — Form / Interaction', () => {
  test('demo Google sign-in navigates to today', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /continue with google/i }).click();
    await expect(page).toHaveURL(/\/today/);
  });
});
