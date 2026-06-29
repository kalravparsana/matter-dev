import { test, expect } from '@playwright/test';

test.describe('Login — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('sign in heading and Google button render', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    const button = page.getByRole('button', { name: /continue with google/i });
    await expect(button).toBeVisible();
    if (
      process.env.VITE_API_BASE_URL &&
      process.env.VITE_COGNITO_DOMAIN &&
      process.env.VITE_COGNITO_CLIENT_ID &&
      process.env.VITE_OAUTH_REDIRECT_URI
    ) {
      await expect(button).toBeEnabled();
    } else {
      await expect(button).toBeDisabled();
    }
  });

  test('workspace hint text is visible', async ({ page }) => {
    await expect(page.getByText(/meridian/i).first()).toBeVisible();
  });
});
