import { test, expect } from '@playwright/test';

test.describe('Login — Accessibility', () => {
  test('heading and button are keyboard reachable', async ({ page }) => {
    await page.goto('/login');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('sign-in button has accessible name', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
  });
});
