import { test, expect } from '@playwright/test';

test.describe('Login — Error States', () => {
  test('shows error when authorize-url fails', async ({ page }) => {
    test.skip(
      !process.env.VITE_API_BASE_URL ||
        !process.env.VITE_COGNITO_DOMAIN ||
        !process.env.VITE_COGNITO_CLIENT_ID ||
        !process.env.VITE_OAUTH_REDIRECT_URI,
      'Cognito OAuth env vars are not configured for this run',
    );

    await page.route('**/api/v1/auth/authorize-url', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Sign-in is not set up yet' }),
      }),
    );
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('mattar_tokens', JSON.stringify({ idToken: 'x' }));
    });
    await page.getByRole('button', { name: /continue with google/i }).click();
    await expect(page.getByRole('alert')).toContainText(/sign-in/i);
  });
});
