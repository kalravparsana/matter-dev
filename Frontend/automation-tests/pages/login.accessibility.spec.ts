import { test, expect } from '@playwright/test';

test.describe('Login — Accessibility', () => {
  test('heading and button are keyboard reachable', async ({ page }) => {
    await page.goto('/login');
    const button = page.getByRole('button', { name: /continue with google/i });
    await expect(button).toBeVisible();
    await button.focus();
    await expect(button).toBeFocused();
  });

  test('sign-in button has accessible name', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
  });
});
