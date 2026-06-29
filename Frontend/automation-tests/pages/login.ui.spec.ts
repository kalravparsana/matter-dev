import { test, expect } from '@playwright/test';

test.describe('Login — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('sign in heading and Google button render', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeEnabled();
  });

  test('workspace hint text is visible', async ({ page }) => {
    await expect(page.getByText(/meridian/i).first()).toBeVisible();
  });
});
