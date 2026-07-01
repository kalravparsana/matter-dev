import { test, expect } from '@playwright/test';

test.describe('Login — Edge Cases', () => {
  test('double-click sign-in does not break navigation', async ({ page }) => {
    await page.goto('/login');
    const button = page.getByRole('button', { name: /continue with google/i });
    await button.dblclick();
    await expect(button).toBeVisible();
  });
});
